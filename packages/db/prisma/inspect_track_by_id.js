const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = process.argv[2];
  if (!id) return console.log('Usage: node inspect_track_by_id.js <id>');
  try {
    const track = await prisma.track.findUnique({ where: { id }, include: { modules: true, games: true } });
    console.log(JSON.stringify(track, null, 2));
  } catch (err) {
    console.error('Prisma error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
