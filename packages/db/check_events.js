const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: { name: true, email: true }
        },
        registrations: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    console.log('Events in database:');
    events.forEach(event => {
      console.log(`- ${event.title} (${event.type})`);
      console.log(`  Created by: ${event.creator.name} (${event.creator.email})`);
      console.log(`  Date: ${event.startTime} to ${event.endTime}`);
      console.log(`  Location: ${event.location}`);
      console.log(`  Capacity: ${event.registrations.length}/${event.capacity}`);
      console.log(`  Registrations: ${event.registrations.map(r => r.user.name).join(', ') || 'None'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();