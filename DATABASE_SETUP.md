# Database Setup Guide

This guide explains how to set up the SQLite database locally for development.

## Overview

- **Database**: SQLite (file-based, no server needed)
- **Location**: `./data/sheepai.db`
- **ORM**: Prisma v5
- **Status**: The database file is **NOT** committed to git (see `.gitignore`)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up the Database

Run the migrations to create the schema:

```bash
npm run db:migrate:prod
```

Or if you want to reset and seed with sample data:

```bash
npm run db:reset
npm run db:seed
```

### 3. View Your Data

Open Prisma Studio to browse the database:

```bash
npm run db:studio
```

This opens a web UI at `http://localhost:5555` where you can view and edit data.

## Database Scripts

| Command                   | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `npm run db:migrate`      | Create a new migration after schema changes |
| `npm run db:migrate:prod` | Apply migrations (use this for fresh setup) |
| `npm run db:studio`       | Open Prisma Studio to browse data           |
| `npm run db:reset`        | ⚠️ Drop and recreate database (dev only)    |
| `npm run db:generate`     | Regenerate Prisma client                    |
| `npm run db:seed`         | Populate with sample data                   |

## Schema Overview

### Ticket

Represents a consolidated issue that may have multiple raw ingestion outputs.

**Fields:**

- `id` - Unique identifier (CUID)
- `title` - Issue title
- `description` - Detailed description
- `status` - One of: `pending_approval`, `open`, `in_progress`, `resolved`, `rejected`
- `priority` - One of: `low`, `medium`, `high`, `critical`
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

**Relationships:**

- One Ticket can have many RawIngestorOutputs

### RawIngestorOutput

Represents raw data from the ingestion pipeline (Reddit, Twitter, etc.).

**Fields:**

- `id` - Unique identifier (CUID)
- `dataSource` - Source of the data (e.g., "reddit", "twitter")
- `summary` - LLM-generated summary of the issue
- `timestamp` - When the issue was reported upstream
- `metadata` - JSON string with additional context (author, URL, upvotes, etc.)
- `ticketId` - Foreign key to Ticket (optional, can be null)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

**Relationships:**

- Many RawIngestorOutputs belong to one Ticket

## Workflow

### When You Change the Schema

1. Edit `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npm run db:migrate -- --name describe_your_change
   ```
3. Commit the migration files to git
4. Other team members will automatically apply migrations on next `npm install`

### When You Add New Seed Data

1. Edit the seed files in `scripts/seeds/`
2. Run:
   ```bash
   npm run db:seed
   ```

### When You Pull Changes

If someone pushed schema changes:

```bash
npm install
npm run db:migrate:prod
npm run db:seed  # Optional: refresh sample data
```

## Important Notes

- ✅ **Schema files** (`prisma/schema.prisma`, `prisma/migrations/`) are committed to git
- ❌ **Database file** (`data/sheepai.db`) is NOT committed (in `.gitignore`)
- ❌ **Environment files** (`.env`, `.env.local`) are NOT committed
- ✅ **Seed scripts** (`scripts/seeds/`) are committed to git

Each developer gets their own local database file that's created fresh from migrations.

## Troubleshooting

### "Database file not found"

Run migrations first:

```bash
npm run db:migrate:prod
```

### "Schema validation error"

Make sure `DATABASE_URL` is set in `.env`:

```
DATABASE_URL=file:./data/sheepai.db
```

### "Port 5555 already in use"

Prisma Studio is already running. Kill the process or use a different port:

```bash
npx prisma studio --port 5556
```

### "Need to reset everything"

```bash
npm run db:reset
npm run db:seed
```

## Using the Database in Code

```typescript
import { prisma } from "@/app/lib/db";

// Query tickets
const tickets = await prisma.ticket.findMany({
  where: { status: "open" },
  include: { rawOutputs: true },
});

// Create a ticket
const ticket = await prisma.ticket.create({
  data: {
    title: "New issue",
    description: "Description here",
    status: "pending_approval",
    priority: "high",
  },
});

// Update a ticket
await prisma.ticket.update({
  where: { id: ticketId },
  data: { status: "in_progress" },
});
```

## Questions?

Refer to the [Prisma documentation](https://www.prisma.io/docs/) or ask the team!
