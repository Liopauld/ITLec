const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const title = process.argv[2] || 'Software Development';
  const track = await prisma.track.findFirst({ where: { title }, include: { modules: true, games: true } });
  if (!track) return console.log('Track not found');
  console.log(JSON.stringify(track, null, 2));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
