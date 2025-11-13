const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🪙 Updating coins and hints for modules based on difficulty...');

  // Get all tracks with their modules
  const tracks = await prisma.track.findMany({
    include: {
      modules: true
    }
  });

  let updatedCount = 0;

  for (const track of tracks) {
    const difficulty = track.difficulty?.toLowerCase();
    
    // Determine coin rewards and hint costs based on difficulty
    let coinReward, hintCost;
    
    switch (difficulty) {
      case 'beginner':
        coinReward = 10;
        hintCost = 0; // Free hints for beginners!
        break;
      case 'intermediate':
        coinReward = 20;
        hintCost = 10;
        break;
      case 'advanced':
        coinReward = 30;
        hintCost = 20;
        break;
      default:
        coinReward = 10;
        hintCost = 5;
    }

    // Update all modules in this track
    for (const module of track.modules) {
      await prisma.module.update({
        where: { id: module.id },
        data: {
          coinReward,
          hintCost,
          hints: {
            general: difficulty === 'beginner' 
              ? 'Take your time and read the instructions carefully. You got this!'
              : difficulty === 'intermediate'
              ? 'Think about what you learned in the beginner modules. Break down the problem into smaller steps.'
              : 'This is challenging! Review the related concepts and try different approaches.',
            specific: []
          }
        }
      });
      updatedCount++;
    }

    console.log(`✅ Updated ${track.modules.length} modules in "${track.title}" (${difficulty})`);
    console.log(`   💰 Coin reward: ${coinReward} | 💡 Hint cost: ${hintCost === 0 ? 'FREE' : hintCost}`);
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} modules!`);
  console.log('\n💡 Hint Pricing:');
  console.log('   🌱 Beginner: FREE hints (0 coins)');
  console.log('   🔥 Intermediate: 10 coins per hint');
  console.log('   ⚡ Advanced: 20 coins per hint');
  console.log('\n💰 Coin Rewards:');
  console.log('   🌱 Beginner: 10 coins per module');
  console.log('   🔥 Intermediate: 20 coins per module');
  console.log('   ⚡ Advanced: 30 coins per module');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
