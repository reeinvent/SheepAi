import { DataIngestionService } from "../src/ingestion/dataIngestionService";
import { MockXIngestor } from "../src/ingestion/X/mockXIngestor";

async function main() {
  const service = new DataIngestionService({
    // Tight cadence so we don't sit around for the default 60s.
    validationIntervalMs: 10_000,
  });
  service.register(new MockXIngestor({ intervalMs: 10_000 }));

  await service.start();
  // runOnStart fires one tick immediately; give the async fetch+stage a
  // moment to finish writing files before we tear timers down.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  service.stop();
  console.log("[test] service stopped");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
