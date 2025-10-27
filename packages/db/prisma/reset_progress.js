const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting game progress for all users...');
  
  // Get all track progress records
  const allProgress = await prisma.trackProgress.findMany();
  
  console.log(`Found ${allProgress.length} progress records to update`);
  
  for (const progress of allProgress) {
    // Clear the completedGames array but keep completedModules
    await prisma.trackProgress.update({
      where: { id: progress.id },
      data: {
        completedGames: []
      }
    });
  }
  
  console.log('✅ All game progress has been reset!');
  console.log('ℹ️  Module progress has been preserved.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
