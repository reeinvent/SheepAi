Your job is to go through the raw inputs in the database and generate Ticket entities from them. Ticket to raw input is one to many. Process inputs in batches, once processed, mark them all by setting the "processedAt" field to the current timestamp (date). Only process inputs where processedAt is null. Go through the unprocessed inputs one by one and determine if they match an existing non-closed ticket or if they are a new issue. New issues generate new tickets and are connected to them through ticketId, existing issues are appended to the existing ticket also via ticketId.

Estimate ticket priority between low | medium | high | critical.
Generate the title yourself. Croatian is the primary language.

---

## How to run this task

### Schema / DB

- Source table: `RawIngestorOutput` (see `prisma/schema.prisma`). Process rows where `processedAt IS NULL`.
- Destination table: `Ticket`. Relation is `Ticket.rawOutputs` ↔ `RawIngestorOutput.ticketId`.
- "Non-closed" tickets eligible to append to: `status IN ('pending_approval', 'open', 'in_progress')`. Skip `resolved` and `rejected`.
- Newly created tickets keep the schema default `status = 'pending_approval'` so a human can approve them downstream.
- DB is local SQLite at `prisma/data/sheepai.db`; the Prisma client is exported from `app/lib/db.ts`.

### Mechanics

- No LLM SDK is wired up — the categorization is performed by the assistant reading summaries and grouping them by hand. Don't try to call OpenAI/Anthropic from code.
- Raw inputs are commonly scraped twice (e.g. once via `#split` and once via `@split`) for the same upstream `postId`. Group by `metadata.postId` first so duplicate scrapes land on the same ticket.
- Beyond same-postId dedup, look for **semantic duplicates**: different `postId`s, different authors, sometimes different languages, but describing the same physical incident at the same location (e.g. two residents complaining about the same flickering streetlight on Šperun). These must be merged into one ticket. The mock data in `src/ingestion/X/mockXIngestor.ts` intentionally contains a few such pairs (Šperun light, Velebitska manhole, Šuma Marjan lamp); if the categorization produces a ticket-per-post here, the matching step is broken.
- Existing seeded tickets are often city-wide/generic ("Parking problem u centru Splita"). Specific incidents at specific locations (e.g. parking blocking a particular health center) are usually **new** tickets, not appends. Append only when the input describes the same physical problem at the same location as an existing ticket.
- Each location-specific issue (one broken streetlight, one collapsed manhole, one illegally parked vehicle) is its own ticket — do not merge different streets into one ticket just because the category matches.
- Titles and descriptions must be in Croatian.
- Priority guidance: physical safety risks (collapsed manholes, missing covers, blocked pedestrian crossings, blocked accessibility) → `high`. Quality-of-life issues (general parking shortage, half-working lighting) → `medium`. Reserve `critical` for imminent danger to life.

### Workflow

1. If `prisma/schema.prisma` has new fields not yet migrated, run `npm run db:migrate -- --name <name>` first. The Prisma client is regenerated automatically.
2. Write a throwaway script under `scripts/` (e.g. `scripts/_categorizer-run.ts`) that:
   - Loads all `RawIngestorOutput` with `processedAt = null`, ordered by `timestamp asc`.
   - Loads non-closed `Ticket` rows.
   - Wraps creates + updates in a single `prisma.$transaction` so a crash mid-batch doesn't leave half-processed state.
   - For each new ticket, calls `prisma.ticket.create` then `prisma.rawIngestorOutput.updateMany({ where: { id: { in: rawIds } }, data: { ticketId, processedAt: now } })`.
   - For appends to an existing ticket, just runs the `updateMany` against the existing `ticketId`.
3. Run with `npx tsx scripts/_categorizer-run.ts`. Prisma query logs are noisy — pipe through `grep -v "^prisma:query"`.
4. Verify `stillUnprocessed === 0` and that each new ticket has the expected `rawOutputs.length`.
5. Delete the throwaway script when done — this is a one-off task, not a service.

### Determining ticket category

Each ticket needs to be categorized. Determine ticket category based on the contents. It can have multiple categories but has to have at least one. Use UNCATEGORIZED when you cannot figure out where it fits. The category field is a JSON string array.

The possible categories with an explanation:
SANITATION - anything related to trash like overflowing cans, bad smells and so on. This will be shown to the sanitation department
WATERSUPPLY - murky water etc, meant to be sent to the water utilities
CITY-ADMIN - things that the city administration will want to know about
UNCATEGORIZED - only if it does not fall under the rest.

### What NOT to do

- Don't write a reusable `scripts/categorize.ts` and leave it in the repo. There is no LLM call to automate; the judgment lives in the assistant.
- Don't touch the migrations folder beyond running `db:migrate` for schema changes already made by the user.
- Don't change ticket statuses on existing tickets when appending — only set `ticketId` and `processedAt` on the raw inputs.
- Don't use `prisma.$executeRaw` to work around a stale client. Run the migration instead.
