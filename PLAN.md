# City Issue Planner — Split

> System architecture diagrams: [ARCHITECTURE.md](ARCHITECTURE.md)

## Data Model

### Core `tickets` table (unique data structure)

- `id`, `title`, `summary` (LLM-generated), `raw_content`
- `category_id` → parking / water / electrical / roads / waste / other
- `institution_id` → which city service to route to
- `source_type` → `reddit | facebook | user | city_service`
- `source_refs` (JSON array of raw_report ids that were merged)
- `location` (text + optional lat/lng)
- `status` → `pending_approval | open | in_progress | resolved | rejected`
- `approved_by`, `approved_at`
- `upvotes`, `downvotes` (denormalized counters)
- `created_at`, `updated_at`

### Supporting tables

- `users` — role: `citizen | admin | service_employee`
- `institutions` — City of Split, Vodovod, HEP, etc.
- `categories` — predefined list
- `raw_reports` — raw scraped text, source URL, source_type, processed flag
- `votes` — user_id + ticket_id + direction (unique constraint)
- `ticket_status_history` — full audit trail of status changes

## Next.js App Structure

```
app/
  (public)/
    page.tsx                  # ticket feed with search/filter
    tickets/[id]/page.tsx     # ticket detail + voting
    report/page.tsx           # citizen report form
  (admin)/
    admin/
      page.tsx                # tickets table with filters
      tickets/[id]/page.tsx   # ticket detail + approve/route/status
  api/
    tickets/route.ts          # GET list, POST create
    tickets/[id]/route.ts     # GET, PATCH status
    tickets/[id]/vote/route.ts
    cron/scrape/route.ts      # protected cron endpoint
    auth/[...nextauth]/route.ts
lib/
  db/                         # Prisma client + queries
  llm/
    summarize.ts              # group + summarize raw reports
    classify.ts               # category + institution routing
    deduplicate.ts            # check against existing tickets
  scrapers/
    reddit.ts
    facebook.ts
  cron/
    daily-scan.ts             # orchestrates scrape → LLM → ticket creation
prisma/
  schema.prisma
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL via **Prisma ORM**
- **Auth:** NextAuth.js (credentials for admins, optional OAuth for citizens)
- **LLM:** OpenAI GPT-4o (summarize, classify, deduplicate)
- **Cron:** Vercel Cron Jobs (or `node-cron` if self-hosted) hitting `/api/cron/scrape`
- **Styling:** Tailwind CSS + shadcn/ui
- **Scraping:** Reddit via official API, Facebook via public page RSS or Apify

## LLM Deduplication Logic

1. At cron time, fetch all unprocessed `raw_reports`
2. Ask LLM to group them by topic similarity
3. For each group: compare against existing open tickets (cosine similarity via pgvector, or title matching)
4. If match found → append raw_report ids to `ticket.source_refs`, LLM re-generates summary from the now-larger set of reports, increment report count
5. If no match → LLM generates title + summary + category + institution, create new ticket with `source_refs: [id]`

The `source_refs` array is the single source of truth for how many real-world reports back a ticket — the more reports, the higher the signal for city employees to prioritize.

## Execution Phases

### Phase 1 — Foundation (Day 1)

- Next.js project init, Prisma + PostgreSQL setup
- Full schema migration
- NextAuth with admin/citizen roles
- `.env.example` with all required vars

### Phase 2 — Core Ticket System (Day 1-2)

- Public feed page (list, search, filter by category)
- Ticket detail page with upvote/downvote
- Citizen report form → API → DB
- Categories and institutions seed data

### Phase 3 — Admin Panel (Day 2)

- Admin tickets table with status filters
- Approve / reject / re-route ticket actions
- Status change → `ticket_status_history`
- Institution assignment UI

### Phase 4 — LLM + Scrapers (Day 2-3)

- `lib/scrapers/reddit.ts` and `facebook.ts`
- `lib/llm/summarize.ts`, `classify.ts`, `deduplicate.ts`
- `lib/cron/daily-scan.ts` orchestrator
- `/api/cron/scrape` route (secured with `CRON_SECRET` header)
- Vercel Cron config in `vercel.json`

### Phase 5 — Polish (Day 3)

- Location field on tickets
- Institution-facing filtered view (service employees see only their category)
- Demo seed script with realistic Split data
