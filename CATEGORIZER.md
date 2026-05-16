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

- No LLM SDK is wired up. The flow is: a script dumps state to JSON, the assistant categorizes by hand, a second script writes decisions back. Don't add an OpenAI/Anthropic call inside either script.
- Raw inputs are commonly scraped twice (e.g. once via `#split` and once via `@split`) for the same upstream `postId`. Group by `metadata.postId` first so duplicate scrapes land on the same ticket.
- Beyond same-postId dedup, look for **semantic duplicates**: different `postId`s, different authors, sometimes different languages, but describing the same physical incident at the same location (e.g. two residents complaining about the same flickering streetlight on Šperun). These must be merged into one ticket. The mock data in `src/ingestion/X/mockXIngestor.ts` intentionally contains a few such pairs (Šperun light, Velebitska manhole, Šuma Marjan lamp); if the categorization produces a ticket-per-post here, the matching step is broken.
- Existing seeded tickets are often city-wide/generic ("Parking problem u centru Splita"). Specific incidents at specific locations (e.g. parking blocking a particular health center) are usually **new** tickets, not appends. Append only when the input describes the same physical problem at the same location as an existing ticket.
- Each location-specific issue (one broken streetlight, one collapsed manhole, one illegally parked vehicle) is its own ticket — do not merge different streets into one ticket just because the category matches.
- Titles and descriptions must be in Croatian.
- Priority guidance: physical safety risks (collapsed manholes, missing covers, blocked pedestrian crossings, blocked accessibility) → `high`. Quality-of-life issues (general parking shortage, half-working lighting) → `medium`. Reserve `critical` for imminent danger to life.

### Workflow

The mechanics live in two reusable scripts. The assistant's only job between them is producing `decisions.json`.

1. If `prisma/schema.prisma` has new fields not yet migrated, run `npm run db:migrate -- --name <name>` first. The Prisma client is regenerated automatically.
2. **Export current state.** Run `npm run categorize:export`. This writes:
   - `data/categorizer/raw-inputs.json` — all `RawIngestorOutput` with `processedAt = null`, ordered by `timestamp asc`.
   - `data/categorizer/tickets.json` — all non-closed tickets with their existing `rawOutputs` so you can see what each one already covers.
   Pass a different output directory as the first argument if needed: `npm run categorize:export -- path/to/dir`.
3. **Categorize by hand.** Read both files. Apply the dedup, category, and priority rules above. Produce `data/categorizer/decisions.json` with this shape:
   ```json
   {
     "newTickets": [
       {
         "title": "Croatian title",
         "description": "Croatian description (optional)",
         "priority": "low|medium|high|critical",
         "categories": ["SANITATION"],
         "rawInputIds": ["raw_id_1", "raw_id_2"]
       }
     ],
     "appends": [
       { "ticketId": "existing_ticket_id", "rawInputIds": ["raw_id_3"] }
     ]
   }
   ```
   Every unprocessed raw input you intend to handle in this batch must appear in exactly one entry — either under `newTickets[].rawInputIds` or `appends[].rawInputIds`. New tickets are created with the schema default `status = 'pending_approval'`; the apply step never touches the status of existing tickets.
4. **Apply.** Run `npm run categorize:apply` (or `npm run categorize:apply -- path/to/decisions.json` for a non-default path). The script validates the file with zod, wraps everything in a single `prisma.$transaction`, creates tickets, and sets `ticketId` + `processedAt` on each raw input. It refuses to run if a raw id is unknown, already processed, referenced twice, or if an append targets a closed ticket.
5. **Verify.** The apply step prints `created N new ticket(s)`, `attached N raw input(s)`, and `still unprocessed: N`. Confirm `still unprocessed` matches what you intentionally left out of this batch (usually `0`), and spot-check that each new ticket has the expected `rawOutputs.length` in the DB.

### Determining ticket category

Each ticket needs to be categorized. Determine ticket category based on the contents. It can have multiple categories but has to have at least one. Use UNCATEGORIZED when you cannot figure out where it fits. The category field is a JSON string array.

The possible categories with an explanation:
SANITATION - anything related to trash like overflowing cans, bad smells and so on. This will be shown to the sanitation department
WATERSUPPLY - murky water etc, meant to be sent to the water utilities
CITY-ADMIN - things that the city administration will want to know about
ELECTRICITY - anything related to the power utility
UNCATEGORIZED - only if it does not fall under the rest.

### What NOT to do

- Don't add an LLM call inside `categorize-export.ts` or `categorize-apply.ts`. The judgment lives in the assistant; the scripts only move JSON in and out of the database.
- Don't write yet another throwaway script in `scripts/` — extend the two reusable ones if mechanics need to change.
- Don't touch the migrations folder beyond running `db:migrate` for schema changes already made by the user.
- Don't change ticket statuses on existing tickets when appending — only `ticketId` and `processedAt` on the raw inputs are touched.
- Don't use `prisma.$executeRaw` to work around a stale client. Run the migration instead.
