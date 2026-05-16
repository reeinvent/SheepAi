import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { seedRawIngestorOutputs } from './seeds/rawIngestorOutputs'
import { seedTickets } from './seeds/tickets'

// Load environment variables
config()

// Create a new Prisma client with the SQLite database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./data/sheepai.db',
    },
  },
})

async function main() {
  console.log('🌱 Starting database seed...\n')

  try {
    await seedRawIngestorOutputs(prisma)
    await seedTickets(prisma)

    console.log('\n✅ Database seeding complete!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
