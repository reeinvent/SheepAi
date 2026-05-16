import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

config({ override: true });

const NON_CLOSED_STATUSES = ['pending_approval', 'open', 'in_progress'];
const DEFAULT_OUT_DIR = 'data/categorizer';

async function main() {
  const outDir = process.argv[2] ?? DEFAULT_OUT_DIR;
  const prisma = new PrismaClient({ log: ['warn', 'error'] });

  try {
    const rawInputs = await prisma.rawIngestorOutput.findMany({
      where: { processedAt: null },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        dataSource: true,
        summary: true,
        timestamp: true,
        metadata: true,
      },
    });

    const tickets = await prisma.ticket.findMany({
      where: { status: { in: NON_CLOSED_STATUSES } },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        categories: true,
        rawOutputs: {
          select: {
            id: true,
            dataSource: true,
            summary: true,
            timestamp: true,
            metadata: true,
          },
        },
      },
    });

    await mkdir(outDir, { recursive: true });
    const rawPath = resolve(outDir, 'raw-inputs.json');
    const ticketsPath = resolve(outDir, 'tickets.json');
    const decisionsPath = resolve(outDir, 'decisions.json');

    await writeFile(rawPath, JSON.stringify(rawInputs, null, 2));
    await writeFile(ticketsPath, JSON.stringify(tickets, null, 2));

    console.log(`wrote ${rawInputs.length} unprocessed raw input(s) -> ${rawPath}`);
    console.log(`wrote ${tickets.length} non-closed ticket(s) -> ${ticketsPath}`);
    console.log(`next: write decisions to ${decisionsPath} then run \`npm run categorize:apply\`.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
