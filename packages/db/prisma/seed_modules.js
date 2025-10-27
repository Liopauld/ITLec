const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// This seeder will create a few modules per track and attach existing games to modules when type matches.
// It assumes tracks and games already exist (from seed_tracks.js).

async function main() {
  console.log('🔧 Seeding modules...');

  // Fetch all tracks and games
  const tracks = await prisma.track.findMany({ include: { games: true } });

  // For each track create 3 modules: intro, core, capstone. Link games when types match.
  for (const track of tracks) {
    console.log(`Seeding modules for track: ${track.title}`);

    const baseModules = [
      { type: 'intro', content: { title: 'Introduction', description: `Overview of ${track.title}` }, order: 1 },
      { type: 'core', content: { title: 'Core Concepts', description: `Core concepts for ${track.title}` }, order: 2 },
      { type: 'capstone', content: { title: 'Capstone Project', description: `Capstone for ${track.title}` }, order: 3 }
    ];

    for (const m of baseModules) {
      const createdModule = await prisma.module.create({
        data: {
          trackId: track.id,
          type: m.type,
          content: m.content,
          order: m.order
        }
      });

      // Try to attach a suitable game to the core module when available
      if (m.type === 'core') {
        // match game types by heuristic based on track.title
        let preferredTypes = [];
        switch (track.title) {
          case 'Software Development':
          case 'Web Development':
          case 'AI/ML Engineering':
            preferredTypes = ['coding', 'logic'];
            break;
          case 'Network Engineering':
            preferredTypes = ['network'];
            break;
          case 'Database Administration':
            preferredTypes = ['sql-quiz'];
            break;
          case 'Cybersecurity':
            preferredTypes = ['threat'];
            break;
          default:
            preferredTypes = [];
        }

        if (preferredTypes.length > 0) {
          const gameToAttach = track.games.find(g => preferredTypes.includes(g.type));
          if (gameToAttach) {
            try {
              await prisma.game.update({
                where: { id: gameToAttach.id },
                data: { moduleId: createdModule.id }
              });
              console.log(`  -> Attached game ${gameToAttach.name} to module ${createdModule.id}`);
            } catch (err) {
              console.warn('  -> Failed to attach game (maybe already attached):', err.message);
            }
          }
        }
      }
    }
  }

  console.log('✅ Modules seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
