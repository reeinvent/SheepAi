# SheepAi

Placeholder repository for the SheepAi hackathon project.

## Context

- **Format:** 8-hour hackathon
- **Team size:** 4 people

## Known issues / tech debt

- **`DataIngestionService` uses in-process `setInterval`** (started from `instrumentation.ts`). This only stays alive on a long-running Node host (`next dev`, self-hosted `next start`). On Vercel/serverless, every request is a fresh lambda, so the scheduler will not survive between invocations and ingestors will not fire. Refactor before any serverless deploy — likely switch to Vercel Cron (or equivalent) hitting an API route that calls `service.runDue()` / per-ingestor triggers.

## Running the pipeline

1. Run the app, this runs the scraping logic. It will save raw inputs into the appropriate folders divided by datasource
2. Raw data processing - this will be a dedicated service but is currently implemented by running a LLM agent in a terminal. Run claude or your prefered AI agent in a separate terminal and just tell it to follow instrucitons in ANALYZER.md. The output of this will be processed data in a separate folder
3. LLM output validation. As part of the background task started in step 1 we monitor the LLM output folder, once data lands there it is validated with a zod schema and uploaded to the database
4. Ticket generation - like step 2, currently implemented by calling an agent. Run a separate agent with clean context and ask it to follow CATEGORIZER.md. The output is tickets in the database connected to the raw input entities
