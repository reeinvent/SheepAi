import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';

config({ override: true });

const NON_CLOSED_STATUSES = ['pending_approval', 'open', 'in_progress'] as const;
const CATEGORIES = ['SANITATION', 'WATERSUPPLY', 'CITY-ADMIN', 'ELECTRICITY', 'UNCATEGORIZED'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

const NewTicket = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  priority: z.enum(PRIORITIES),
  categories: z.array(z.enum(CATEGORIES)).min(1),
  rawInputIds: z.array(z.string().min(1)).min(1),
});

const Append = z.object({
  ticketId: z.string().min(1),
  rawInputIds: z.array(z.string().min(1)).min(1),
});

const Decisions = z.object({
  newTickets: z.array(NewTicket).default([]),
  appends: z.array(Append).default([]),
});

const DEFAULT_DECISIONS_PATH = 'data/categorizer/decisions.json';

function collectRawIds(decisions: z.infer<typeof Decisions>): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  const push = (id: string) => {
    if (seen.has(id)) dupes.push(id);
    else seen.add(id);
  };
  for (const t of decisions.newTickets) t.rawInputIds.forEach(push);
  for (const a of decisions.appends) a.rawInputIds.forEach(push);
  if (dupes.length) {
    throw new Error(`Raw input(s) referenced more than once: ${dupes.join(', ')}`);
  }
  return Array.from(seen);
}

async function main() {
  const path = process.argv[2] ?? DEFAULT_DECISIONS_PATH;
  const absolutePath = resolve(path);
  const raw = await readFile(absolutePath, 'utf8');
  const decisions = Decisions.parse(JSON.parse(raw));

  if (decisions.newTickets.length === 0 && decisions.appends.length === 0) {
    console.log(`no decisions in ${absolutePath}, nothing to do.`);
    return;
  }

  const rawIds = collectRawIds(decisions);
  const prisma = new PrismaClient({ log: ['warn', 'error'] });

  try {
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const existingRaws = await tx.rawIngestorOutput.findMany({
        where: { id: { in: rawIds } },
        select: { id: true, processedAt: true },
      });
      if (existingRaws.length !== rawIds.length) {
        const found = new Set(existingRaws.map((r) => r.id));
        const missing = rawIds.filter((id) => !found.has(id));
        throw new Error(`Unknown raw input id(s): ${missing.join(', ')}`);
      }
      const alreadyProcessed = existingRaws.filter((r) => r.processedAt !== null);
      if (alreadyProcessed.length) {
        throw new Error(
          `Raw input(s) already processed: ${alreadyProcessed.map((r) => r.id).join(', ')}`,
        );
      }

      if (decisions.appends.length) {
        const ticketIds = [...new Set(decisions.appends.map((a) => a.ticketId))];
        const tickets = await tx.ticket.findMany({
          where: { id: { in: ticketIds } },
          select: { id: true, status: true },
        });
        const found = new Set(tickets.map((t) => t.id));
        const missing = ticketIds.filter((id) => !found.has(id));
        if (missing.length) {
          throw new Error(`Append target ticket(s) not found: ${missing.join(', ')}`);
        }
        const closed = tickets.filter(
          (t) => !NON_CLOSED_STATUSES.includes(t.status as (typeof NON_CLOSED_STATUSES)[number]),
        );
        if (closed.length) {
          throw new Error(
            `Cannot append to closed ticket(s): ${closed
              .map((t) => `${t.id} (${t.status})`)
              .join(', ')}`,
          );
        }
      }

      let createdTickets = 0;
      let attachedRaws = 0;

      for (const nt of decisions.newTickets) {
        const ticket = await tx.ticket.create({
          data: {
            title: nt.title,
            description: nt.description ?? null,
            priority: nt.priority,
            categories: JSON.stringify(nt.categories),
          },
        });
        const updated = await tx.rawIngestorOutput.updateMany({
          where: { id: { in: nt.rawInputIds } },
          data: { ticketId: ticket.id, processedAt: now },
        });
        createdTickets++;
        attachedRaws += updated.count;
      }

      for (const a of decisions.appends) {
        const updated = await tx.rawIngestorOutput.updateMany({
          where: { id: { in: a.rawInputIds } },
          data: { ticketId: a.ticketId, processedAt: now },
        });
        attachedRaws += updated.count;
      }

      const stillUnprocessed = await tx.rawIngestorOutput.count({
        where: { processedAt: null },
      });

      return { createdTickets, attachedRaws, stillUnprocessed };
    });

    console.log(`created ${result.createdTickets} new ticket(s)`);
    console.log(`attached ${result.attachedRaws} raw input(s)`);
    console.log(`still unprocessed: ${result.stillUnprocessed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
