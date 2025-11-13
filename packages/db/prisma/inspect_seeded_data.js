// Verify seeded tracks with full details
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  console.log('Inspecting seeded tracks...\n');
  
  const tracks = await prisma.track.findMany({
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' }
          },
          games: true
        },
        orderBy: { order: 'asc' }
      },
      creator: {
        select: { name: true, email: true }
      }
    }
  });

  tracks.forEach((track, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TRACK ${index + 1}: ${track.title}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Description: ${track.description}`);
    console.log(`Difficulty: ${track.difficulty}`);
    console.log(`Category: ${track.category}`);
    console.log(`Creator: ${track.creator?.name || 'No creator'}`);
    console.log(`Modules: ${track.modules.length}`);
    
    track.modules.forEach((module, modIndex) => {
      console.log(`\n  MODULE ${modIndex + 1} (Order: ${module.order}):`);
      console.log(`  Lessons: ${module.lessons.length}`);
      module.lessons.forEach((lesson, lessonIndex) => {
        console.log(`    ${lessonIndex + 1}. ${lesson.title} (${lesson.estimatedMins || 0} mins)`);
      });
      
      console.log(`  Games: ${module.games.length}`);
      module.games.forEach((game, gameIndex) => {
        console.log(`    ${gameIndex + 1}. ${game.name} (Type: ${game.type})`);
      });
    });
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Tracks: ${tracks.length}`);
  console.log(`Total Modules: ${tracks.reduce((sum, t) => sum + t.modules.length, 0)}`);
  console.log(`Total Lessons: ${tracks.reduce((sum, t) => sum + t.modules.reduce((s, m) => s + m.lessons.length, 0), 0)}`);
  console.log(`Total Games: ${tracks.reduce((sum, t) => sum + t.modules.reduce((s, m) => s + m.games.length, 0), 0)}`);
  
  // Show game type breakdown
  const allGames = tracks.flatMap(t => t.modules.flatMap(m => m.games));
  const gameTypes = allGames.reduce((acc, game) => {
    acc[game.type] = (acc[game.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nGame Types:');
  Object.entries(gameTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
