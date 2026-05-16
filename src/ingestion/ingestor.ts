import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

/**
 * Ingestion pipeline (4 stages, each runs on its own schedule):
 *
 *   1. FETCH   — `Ingestor` subclass calls the upstream source (X API,
 *                Reddit, Facebook, ...) and pulls raw items.
 *   2. STAGE   — `Ingestor.run()` writes those raw items to
 *                `<rawDir>/<dataSource>/<timestamp>_<source>.json` as a
 *                `RawIngestionPayload`. No canonical shape is enforced;
 *                items are source-specific and unvalidated.
 *   3. LLM     — A separate cron job reads the raw folder, summarizes
 *                each item, filters out irrelevant ones, and writes
 *                records matching `BaseIngestedRecordSchema` into an
 *                output folder.
 *   4. PROMOTE — A validator reads the LLM output folder, runs
 *                `validateIngestedRecord` (+ optional per-source
 *                transform), and forwards to the final destination
 *                (eventually the tickets table).
 *
 * This file owns stages 1+2 (the `Ingestor` base class) and the contract
 * used by stages 3+4 (the schema + `validateIngestedRecord`). The LLM
 * job and the promoter live elsewhere — they only depend on the schema
 * and the folder layout written by `Ingestor.run()`.
 */

// --- Stage 2 output / stage 3 input -----------------------------------------

// Envelope written to the raw folder. Holds source metadata alongside the
// raw items so the LLM stage has full context (which tag/subreddit/page
// was queried, when, and which adapter produced it).
export type RawIngestionPayload<TRaw = unknown> = {
  dataSource: string;
  fetchedAt: string;
  source: string;
  items: TRaw[];
};

// A single batch returned by `Ingestor.fetchRaw()`. One batch → one staged
// file. Multi-query ingestors (e.g. X with several tags) return many
// batches per run; single-query ingestors return a one-element array.
export type RawBatch<TRaw = unknown> = {
  source: string;
  items: TRaw[];
};

// --- Stage 3 output / stage 4 input -----------------------------------------

// Canonical post-LLM record. Subclasses of `Ingestor` do NOT produce this
// shape — the LLM stage does. Downstream consumers (validator, promoter,
// DB writer) rely on these fields being present:
//   - `dataSource` for attribution and per-source routing
//   - `summary`    for the LLM-written description of the issue
//   - `timestamp`  ISO 8601 w/ offset, when the issue was reported upstream
//   - `metadata`   freeform per-record context (ids, urls, author, ...)
export const BaseIngestedRecordSchema = z.object({
  dataSource: z.string().min(1),
  summary: z.string().min(1),
  timestamp: z.iso.datetime({ offset: true }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type BaseIngestedRecord = z.infer<typeof BaseIngestedRecordSchema>;

export class IngestorValidationError extends Error {
  constructor(
    public readonly dataSource: string,
    public readonly index: number,
    public readonly zodError: z.ZodError,
  ) {
    const detail = zodError.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    super(`[${dataSource}] record ${index} failed validation: ${detail}`);
    this.name = "IngestorValidationError";
  }
}

// --- Stage 1+2: the Ingestor base class -------------------------------------

// Abstract base for source-specific ingestors (X, Reddit, Facebook, ...).
//
// Responsibilities are intentionally narrow:
//   - Talk to the upstream source (in `fetchRaw`).
//   - Stage the result to disk (in `run`) so the LLM job can pick it up.
//
// Subclasses are NOT responsible for summarizing, filtering, or producing
// canonical records. Keeping ingestors small means a flaky upstream or a
// bad LLM run can be retried independently.
export abstract class Ingestor<TRaw = unknown> {
  abstract readonly dataSource: string;
  protected readonly rawDir: string;

  constructor(rawDir = "data/raw") {
    this.rawDir = rawDir;
  }

  // Source-specific fetch. Returns one or more batches; each batch becomes
  // a single staged file. The `source` string identifies what was queried
  // (a tag, a subreddit, a page id, ...) and is preserved in the envelope
  // so the LLM job can group or filter by it.
  protected abstract fetchRaw(): Promise<RawBatch<TRaw>[]>;

  // Run the fetch + stage cycle once. Returns the list of staged file
  // paths so a cron orchestrator can log them or hand them off.
  async run(): Promise<string[]> {
    const batches = await this.fetchRaw();
    const fetchedAt = new Date().toISOString();
    const dir = join(this.rawDir, this.dataSource);
    await mkdir(dir, { recursive: true });

    const paths: string[] = [];
    for (const { source, items } of batches) {
      const payload: RawIngestionPayload<TRaw> = {
        dataSource: this.dataSource,
        fetchedAt,
        source,
        items,
      };
      const filename = `${fetchedAt.replace(/[:.]/g, "-")}_${sanitize(source)}.json`;
      const path = join(dir, filename);
      await writeFile(path, JSON.stringify(payload, null, 2), "utf8");
      paths.push(path);
    }
    return paths;
  }
}

// --- Stage 4: validator helpers --------------------------------------------

// Strict single-record validator. Throws on failure. Use this only when a
// single bad record SHOULD abort the caller (tests, ad-hoc scripts). For
// production exports prefer `validateIngestedRecords`, which never lets one
// bad record block the rest of the batch.
export function validateIngestedRecord(
  record: unknown,
  index = 0,
  expectedDataSource?: string,
): BaseIngestedRecord {
  const parsed = BaseIngestedRecordSchema.safeParse(record);
  if (!parsed.success) {
    throw new IngestorValidationError(
      expectedDataSource ?? "unknown",
      index,
      parsed.error,
    );
  }
  if (expectedDataSource && parsed.data.dataSource !== expectedDataSource) {
    throw new Error(
      `[${expectedDataSource}] record ${index} has mismatched dataSource "${parsed.data.dataSource}"`,
    );
  }
  return parsed.data;
}

export type ValidationFailure = {
  index: number;
  error: Error;
  record: unknown;
};

export type ValidationReport = {
  valid: BaseIngestedRecord[];
  failures: ValidationFailure[];
};

// Batch validator for the stage 4 promoter. Validates each record; failures
// are logged and collected into `failures` rather than thrown, so a single
// malformed LLM output never blocks the rest of the export. Callers should
// still inspect `failures` (and probably surface a count to monitoring) so
// silent rot doesn't accumulate.
export function validateIngestedRecords(
  records: unknown[],
  options: {
    expectedDataSource?: string;
    logger?: (message: string, failure: ValidationFailure) => void;
  } = {},
): ValidationReport {
  const logger =
    options.logger ??
    ((message) => {
      console.warn(message);
    });
  const valid: BaseIngestedRecord[] = [];
  const failures: ValidationFailure[] = [];

  records.forEach((record, index) => {
    try {
      valid.push(validateIngestedRecord(record, index, options.expectedDataSource));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const failure: ValidationFailure = { index, error, record };
      logger(`[ingestor:validate] skipping record ${index}: ${error.message}`, failure);
      failures.push(failure);
    }
  });

  return { valid, failures };
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^_+|_+$/g, "") || "unknown";
}
