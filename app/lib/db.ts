import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// override:true so this project's DATABASE_URL wins over any value already
// present in the shell (e.g. a Postgres URL exported for a different project).
config({ override: true })

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
