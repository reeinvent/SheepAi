/**
 * End-to-end test of the RSS ingestion pipeline.
 *
 * Stages run in sequence:
 *   1+2  RssIngestor.run()        → data/raw/rss/<timestamp>_rss.json
 *   3    Agent fixture             → src/ingestion/fixtures/rss/processed.json
 *   4    validateIngestedRecords   → data/validated/rss-<date>.json
 *
 * Run:
 *   npm run test:rss
 */

import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { NewsIngestor } from "../src/ingestion/newsScraper/newsIngestor";
import { validateIngestedRecords } from "../src/ingestion/ingestor";

const FIXTURE  = "src/ingestion/fixtures/rss/processed.json";
const OUT_DIR  = "data/validated";

async function main() {
  // ── Stage 1+2: fetch + stage raw ──────────────────────────────────────────
  console.log("Stage 1+2  Fetching RSS feeds…");
  const ingestor = new NewsIngestor();
  const stagedPaths = await ingestor.run();
  console.log(`           Staged → ${stagedPaths[0]}\n`);

  // ── Stage 3 (agent fixture): load pre-summarised records ──────────────────
  console.log("Stage 3    Loading agent-processed fixture…");
  const raw = JSON.parse(await readFile(FIXTURE, "utf8")) as unknown[];
  console.log(`           ${raw.length} records loaded from ${FIXTURE}\n`);

  // ── Stage 4: validate each record against BaseIngestedRecordSchema ─────────
  console.log("Stage 4    Validating…");
  const { valid, failures } = validateIngestedRecords(raw, {
    logger: (msg) => console.warn(`  ⚠ ${msg}`),
  });
  console.log(`           ✓ ${valid.length} valid   ✗ ${failures.length} failed\n`);

  // ── Write single output file ───────────────────────────────────────────────
  const date = new Date().toISOString().slice(0, 10);
  const outPath = `${OUT_DIR}/rss-${date}.json`;
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(outPath, JSON.stringify(valid, null, 2), "utf8");
  console.log(`Output     → ${outPath}`);

  // ── Sample ─────────────────────────────────────────────────────────────────
  console.log("\nSample record:");
  console.log(JSON.stringify(valid[0], null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
