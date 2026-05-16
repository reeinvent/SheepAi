import { PrismaClient } from '@prisma/client'

export async function seedRawIngestorOutputs(prisma: PrismaClient) {
  console.log('🌱 Seeding raw ingestor outputs...')

  await prisma.rawIngestorOutput.deleteMany()

  const outputs = await prisma.rawIngestorOutput.createMany({
    data: [
      {
        dataSource: 'reddit',
        summary: 'Stanovnici Splita se žale na loše stanje cesta u centru grada, posebno na Riva gdje su pukotine opasne za bicikliste',
        timestamp: new Date('2026-05-15T10:30:00Z'),
        metadata: JSON.stringify({
          sourceId: 'reddit_123',
          url: 'https://reddit.com/r/split/comments/123',
          author: 'splitski_stanovnik',
          upvotes: 245,
          location: 'Split, Riva',
        }),
      },
      {
        dataSource: 'twitter',
        summary: 'Javni prijevoz u Splitu - autobusi kasne 20+ minuta, putnici čekaju na stanicama bez zaštite od sunca',
        timestamp: new Date('2026-05-15T14:15:00Z'),
        metadata: JSON.stringify({
          sourceId: 'twitter_456',
          url: 'https://twitter.com/splitski_grad/status/789',
          author: 'splitski_putnik',
          likes: 89,
          location: 'Split, autobusna stanica',
        }),
      },
      {
        dataSource: 'reddit',
        summary: 'Parking u Splitu - nema dovoljno mjesta, cijene su previsoke, a kontrola je loša',
        timestamp: new Date('2026-05-14T09:45:00Z'),
        metadata: JSON.stringify({
          sourceId: 'reddit_789',
          url: 'https://reddit.com/r/split/comments/456',
          author: 'vozac_split',
          upvotes: 156,
          location: 'Split, centar',
        }),
      },
    ],
  })

  console.log(`✅ Created ${outputs.count} raw ingestor outputs`)
  return outputs
}

