import { PrismaClient } from '@prisma/client'

export async function seedTickets(prisma: PrismaClient) {
  console.log('🌱 Seeding tickets...')

  await prisma.ticket.deleteMany()

  const tickets = await prisma.ticket.createMany({
    data: [
      {
        title: 'Loše stanje cesta na Rivi u Splitu',
        description: 'Ceste na Rivi su u lošem stanju s pukotinama koje su opasne za bicikliste i pješake. Potrebna je hitna sanacija.',
        status: 'pending_approval',
        priority: 'high',
        categories: '[]',
      },
      {
        title: 'Javni prijevoz - kašnjenja autobusa',
        description: 'Autobusi u Splitu redovito kasne 20+ minuta. Putnici čekaju na stanicama bez zaštite od sunca i kiše. Potrebno poboljšati raspored i dodati zaštitne strukture.',
        status: 'open',
        priority: 'high',
        categories: '[]',
      },
      {
        title: 'Parking problem u centru Splita',
        description: 'Nedostatak parkirnih mjesta, previsoke cijene, i loša kontrola. Potrebna je bolja organizacija i više mjesta za parkiranje.',
        status: 'in_progress',
        priority: 'medium',
        categories: '[]',
      },
    ],
  })

  console.log(`✅ Created ${tickets.count} tickets`)
  return tickets
}

