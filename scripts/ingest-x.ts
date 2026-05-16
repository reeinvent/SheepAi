import { XIngestor } from "../src/ingestion/X/xIngestor";

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter(Boolean);
  const tags = args.length > 0 ? args : undefined;

  const ingestor = new XIngestor({ tags });
  const results = await ingestor.run();

  for (const r of results) {
    console.log(`[x] ${r.tag} → ${r.count} post(s) → ${r.filePath}`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
