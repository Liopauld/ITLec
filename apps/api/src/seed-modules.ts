import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Example: Add modules to all tracks
  const tracks = await prisma.track.findMany();
  for (const track of tracks) {
    // Add coding module
    await prisma.module.create({
      data: {
        trackId: track.id,
        type: 'coding',
        content: { name: 'Intro Coding Game', description: 'Solve a simple coding challenge.' },
        order: 1
      }
    });
    // Add network builder module
    await prisma.module.create({
      data: {
        trackId: track.id,
        type: 'network',
        content: { name: 'Network Builder', description: 'Build a valid network topology.' },
        order: 2
      }
    });
    // Add threat detection module
    await prisma.module.create({
      data: {
        trackId: track.id,
        type: 'threat',
        content: { name: 'Threat Detection', description: 'Identify threats in a scenario.' },
        order: 3
      }
    });
    // Add SQL quiz module
    await prisma.module.create({
      data: {
        trackId: track.id,
        type: 'sql-quiz',
        content: { name: 'SQL Quiz', description: 'Answer SQL questions.' },
        order: 4
      }
    });
  }
  console.log('Modules seeded for all tracks.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
