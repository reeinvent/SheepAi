// Next.js calls `register()` once when the server boots (both `next dev`
// and `next start`). We use it to bring up the in-process
// `DataIngestionService` so the scheduler is alive for as long as the
// Node server is. This is the canonical Next.js hook for "do this when
// the app starts"; see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation.
//
// Note: this only works on a long-running Node host (self-hosted or
// `next dev`). On Vercel-style serverless each request is a fresh
// lambda, so the setInterval-based scheduler cannot survive between
// invocations there — use Vercel Cron + a route handler instead in
// that environment.

export async function register() {
  // The instrumentation hook fires for every Next.js runtime (nodejs,
  // edge). We only want to schedule work in the Node runtime, since
  // both the service and the ingestors depend on `node:fs/promises`.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // `next dev` re-invokes `register()` on every reload of this file
  // (and adjacent code). Without a singleton guard, each reload stacks
  // another full set of timers on top of the existing ones — easy to
  // miss until upstream APIs start rate-limiting.
  const globalState = globalThis as typeof globalThis & {
    __ingestionStarted?: boolean;
  };
  if (globalState.__ingestionStarted) return;
  globalState.__ingestionStarted = true;

  // Dynamic imports keep this file from pulling Node-only modules into
  // the edge runtime's module graph during build analysis.
  const { DataIngestionService } = await import(
    "./src/ingestion/dataIngestionService"
  );
  const { MockXIngestor } = await import("./src/ingestion/X/mockXIngestor");
  const { RedditIngestor } = await import(
    "./src/ingestion/redditScrapper/redditIngestor"
  );

  const service = new DataIngestionService();
  service.register(new MockXIngestor());
  service.register(new RedditIngestor());
  await service.start();

  // Hand the timers back to the runtime cleanly on shutdown so a dev
  // restart or a prod SIGTERM doesn't leave intervals firing into a
  // half-torn-down process.
  const stop = () => service.stop();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  console.log("[instrumentation] DataIngestionService started");
}
