const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying games with challengeIds...\n');
  
  const softwareTrack = await prisma.track.findFirst({
    where: { title: 'Software Development' },
    include: { games: true }
  });
  
  if (softwareTrack) {
    console.log(`Track: ${softwareTrack.title}`);
    console.log(`ID: ${softwareTrack.id}`);
    console.log(`\nGames (${softwareTrack.games.length}):`);
    
    softwareTrack.games.forEach((game, idx) => {
      console.log(`\n${idx + 1}. ${game.name}`);
      console.log(`   Type: ${game.type}`);
      console.log(`   Challenge ID: ${game.content.challengeId || 'MISSING!'}`);
      console.log(`   Description: ${game.content.description}`);
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
