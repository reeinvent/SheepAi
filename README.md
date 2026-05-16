# SheepAi

Placeholder repository for the SheepAi hackathon project.

## Context

- **Format:** 8-hour hackathon
- **Team size:** 4 people

## Known issues / tech debt

- **`DataIngestionService` uses in-process `setInterval`** (started from `instrumentation.ts`). This only stays alive on a long-running Node host (`next dev`, self-hosted `next start`). On Vercel/serverless, every request is a fresh lambda, so the scheduler will not survive between invocations and ingestors will not fire. Refactor before any serverless deploy — likely switch to Vercel Cron (or equivalent) hitting an API route that calls `service.runDue()` / per-ingestor triggers.
