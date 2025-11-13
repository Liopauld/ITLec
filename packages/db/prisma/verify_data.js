const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying seeded data...\n');

  // Check users
  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true }
  });
  console.log(`👥 Users (${users.length}):`);
  users.forEach(u => console.log(`   - ${u.name} (${u.role}) - ${u.email}`));

  // Check tracks
  const tracks = await prisma.track.findMany({
    include: {
      modules: {
        include: {
          lessons: true,
          games: true
        }
      }
    }
  });
  
  console.log(`\n📚 Tracks (${tracks.length}):`);
  tracks.forEach(track => {
    const lessonCount = track.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const gameCount = track.modules.reduce((sum, m) => sum + m.games.length, 0);
    console.log(`   - ${track.title} (${track.difficulty})`);
    console.log(`     Modules: ${track.modules.length}, Lessons: ${lessonCount}, Games: ${gameCount}`);
  });

  // Check events
  const events = await prisma.event.findMany({
    select: { title: true, type: true, startTime: true }
  });
  console.log(`\n🎉 Events (${events.length}):`);
  events.forEach(e => console.log(`   - ${e.title} (${e.type}) - ${e.startTime.toLocaleDateString()}`));

  // Check questions
  const questions = await prisma.question.count();
  console.log(`\n❓ Assessment Questions: ${questions}`);

  console.log('\n✅ Data verification complete!');
  
  await prisma.$disconnect();
}

verifyData().catch(console.error);
