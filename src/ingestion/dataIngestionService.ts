import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import {
  validateIngestedRecords,
  type Ingestor,
  type ValidationFailure,
} from "./ingestor";

/**
 * Central orchestrator for the ingestion pipeline.
 *
 * Three folders, one per pipeline boundary:
 *
 *   rawDir       — Each `Ingestor` subclass writes here (stages 1+2).
 *                  Owned by this app.
 *   llmInboxDir  — An EXTERNAL LLM process reads `rawDir`, produces
 *                  canonical records, and drops them here. This app does
 *                  NOT run the LLM — it only consumes the output.
 *   validatedDir — `DataIngestionService` validates each file from
 *                  `llmInboxDir` against `BaseIngestedRecordSchema` and
 *                  writes the surviving records here. Downstream pipeline
 *                  steps consume from this folder.
 *
 * The service does two things on its own timers:
 *
 *   1. For each registered `Ingestor`, runs `ingestor.run()` every
 *      `ingestor.intervalMs` milliseconds.
 *   2. On an independent timer, scans `llmInboxDir` for `.json` files,
 *      validates each one, writes the valid records to `validatedDir`,
 *      and moves the source file out of the inbox so it isn't re-tried.
 *
 * Validation and ingestion are decoupled on purpose: the LLM step is
 * external and asynchronous, so binding validation to an ingestor tick
 * would only re-validate stale state.
 */

export interface DataIngestionServiceOptions {
  // Folder where the external LLM drops canonical records waiting to be
  // validated. Layout convention: `<llmInboxDir>/<dataSource>/<file>.json`.
  llmInboxDir?: string;
  // Folder that receives the validated records. Mirrors the inbox layout:
  // `<validatedDir>/<dataSource>/<file>.json`.
  validatedDir?: string;
  // Subfolder under `llmInboxDir` where consumed source files are parked
  // after validation, so a subsequent tick doesn't pick them up again.
  // Kept (not deleted) so a bad validator deploy is recoverable.
  processedSubdir?: string;
  // Same as `processedSubdir` but for files we couldn't even parse as the
  // expected shape (bad JSON, not an array). Quarantined for inspection.
  quarantineSubdir?: string;
  // How often the validation loop scans `llmInboxDir`.
  validationIntervalMs?: number;
  // Run each ingestor + the validator once immediately on `start()` rather
  // than waiting a full interval. Defaults to true.
  runOnStart?: boolean;
  logger?: (message: string) => void;
}

interface Registration {
  ingestor: Ingestor;
  timer?: ReturnType<typeof setInterval>;
  running: boolean;
}

const DEFAULT_VALIDATION_INTERVAL_MS = 60_000;

export class DataIngestionService {
  private readonly registrations = new Map<string, Registration>();
  private readonly llmInboxDir: string;
  private readonly validatedDir: string;
  private readonly processedSubdir: string;
  private readonly quarantineSubdir: string;
  private readonly validationIntervalMs: number;
  private readonly runOnStart: boolean;
  private readonly logger: (message: string) => void;
  private validationTimer?: ReturnType<typeof setInterval>;
  private validationRunning = false;
  private started = false;

  constructor(options: DataIngestionServiceOptions = {}) {
    this.llmInboxDir = options.llmInboxDir ?? "data/llm-out";
    this.validatedDir = options.validatedDir ?? "data/validated";
    this.processedSubdir = options.processedSubdir ?? ".processed";
    this.quarantineSubdir = options.quarantineSubdir ?? ".quarantine";
    this.validationIntervalMs =
      options.validationIntervalMs ?? DEFAULT_VALIDATION_INTERVAL_MS;
    this.runOnStart = options.runOnStart ?? true;
    this.logger = options.logger ?? ((message) => console.log(message));
  }

  register(ingestor: Ingestor): this {
    if (this.started) {
      throw new Error(
        "DataIngestionService.register() must be called before start().",
      );
    }
    if (this.registrations.has(ingestor.dataSource)) {
      throw new Error(
        `Ingestor for dataSource "${ingestor.dataSource}" is already registered.`,
      );
    }
    if (!Number.isFinite(ingestor.intervalMs) || ingestor.intervalMs <= 0) {
      throw new Error(
        `Ingestor "${ingestor.dataSource}" must declare a positive intervalMs.`,
      );
    }
    this.registrations.set(ingestor.dataSource, { ingestor, running: false });
    return this;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    // Drop each ingestor's LLM instructions into its raw folder before
    // any data arrives, so the external LLM reading from `rawDir` always
    // has up-to-date guidance alongside the files it's about to parse.
    for (const reg of this.registrations.values()) {
      await this.writeInstructions(reg.ingestor);
    }

    for (const reg of this.registrations.values()) {
      reg.timer = setInterval(
        () => void this.tickIngestor(reg),
        reg.ingestor.intervalMs,
      );
      if (this.runOnStart) void this.tickIngestor(reg);
    }

    this.validationTimer = setInterval(
      () => void this.tickValidation(),
      this.validationIntervalMs,
    );
    if (this.runOnStart) void this.tickValidation();
  }

  private async writeInstructions(ingestor: Ingestor): Promise<void> {
    const dir = join(ingestor.rawDir, ingestor.dataSource);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "INSTRUCTIONS.md"), ingestor.llmInstructions, "utf8");
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    for (const reg of this.registrations.values()) {
      if (reg.timer) clearInterval(reg.timer);
      reg.timer = undefined;
    }
    if (this.validationTimer) clearInterval(this.validationTimer);
    this.validationTimer = undefined;
  }

  // --- ingestor tick -------------------------------------------------------

  private async tickIngestor(reg: Registration): Promise<void> {
    // Skip overlapping ticks rather than queue them — if an ingestor is
    // slow (rate-limited upstream, network hiccup) we'd rather drop the
    // tick than stack up parallel fetches that race on the same files.
    if (reg.running) {
      this.logger(
        `[ingest:${reg.ingestor.dataSource}] previous tick still running; skipping`,
      );
      return;
    }
    reg.running = true;
    try {
      const paths = await reg.ingestor.run();
      this.logger(
        `[ingest:${reg.ingestor.dataSource}] staged ${paths.length} file(s)`,
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger(
        `[ingest:${reg.ingestor.dataSource}] FAILED: ${error.message}`,
      );
    } finally {
      reg.running = false;
    }
  }

  // --- validation tick -----------------------------------------------------

  private async tickValidation(): Promise<void> {
    if (this.validationRunning) {
      this.logger("[validate] previous tick still running; skipping");
      return;
    }
    this.validationRunning = true;
    try {
      const files = await listJsonFiles(this.llmInboxDir, [
        this.processedSubdir,
        this.quarantineSubdir,
      ]);
      for (const absPath of files) {
        await this.validateFile(absPath);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger(`[validate] FAILED: ${error.message}`);
    } finally {
      this.validationRunning = false;
    }
  }

  private async validateFile(absPath: string): Promise<void> {
    const relPath = relative(this.llmInboxDir, absPath);
    let parsed: unknown;
    try {
      const raw = await readFile(absPath, "utf8");
      parsed = JSON.parse(raw);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger(`[validate] ${relPath}: unreadable (${error.message})`);
      await this.moveOut(absPath, relPath, this.quarantineSubdir);
      return;
    }

    // Accept either a bare array of records or `{ records: [...] }` — the
    // external LLM may wrap its output, and the wrapper shape isn't part
    // of our contract. Anything else is quarantined.
    const records =
      Array.isArray(parsed) && parsed
        ? parsed
        : Array.isArray((parsed as { records?: unknown[] } | null)?.records)
          ? (parsed as { records: unknown[] }).records
          : null;

    if (!records) {
      this.logger(
        `[validate] ${relPath}: expected JSON array or { records: [] }`,
      );
      await this.moveOut(absPath, relPath, this.quarantineSubdir);
      return;
    }

    // Path convention: <llmInboxDir>/<dataSource>/<file>. If the file
    // sits in a subfolder, treat that subfolder name as the expected
    // dataSource — `validateIngestedRecords` will flag mismatches.
    const segments = relPath.split(sep).filter(Boolean);
    const expectedDataSource =
      segments.length > 1 ? segments[0] : undefined;

    const { valid, failures } = validateIngestedRecords(records, {
      expectedDataSource,
      logger: (message) => this.logger(message),
    });

    const outPath = join(this.validatedDir, relPath);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(valid, null, 2), "utf8");

    if (failures.length > 0) {
      const failurePath = outPath.replace(/\.json$/i, ".failures.json");
      await writeFile(
        failurePath,
        JSON.stringify(serializeFailures(failures), null, 2),
        "utf8",
      );
    }

    this.logger(
      `[validate] ${relPath}: ${valid.length} valid, ${failures.length} failed`,
    );

    await this.moveOut(absPath, relPath, this.processedSubdir);
  }

  private async moveOut(
    absPath: string,
    relPath: string,
    subdir: string,
  ): Promise<void> {
    const dest = join(this.llmInboxDir, subdir, relPath);
    await mkdir(dirname(dest), { recursive: true });
    await rename(absPath, dest);
  }
}

function serializeFailures(failures: ValidationFailure[]) {
  return failures.map((f) => ({
    index: f.index,
    error: f.error.message,
    record: f.record,
  }));
}

async function listJsonFiles(
  rootDir: string,
  excludeDirs: string[],
): Promise<string[]> {
  const result: string[] = [];
  const skip = new Set(excludeDirs);
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      // Missing root or transient race — treat as empty.
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (skip.has(entry.name)) continue;
        await walk(join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        result.push(join(dir, entry.name));
      }
    }
  }
  await walk(rootDir);
  return result;
}
