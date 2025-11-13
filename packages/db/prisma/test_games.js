const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCoding(game) {
  const sc = game.content && game.content.starterCode;
  if (!sc) return `MISSING starterCode`;
  if (typeof sc !== 'string') return `starterCode not string`;
  if (!/function|def|=>/.test(sc)) return `starterCode looks unusual`;
  return null;
}

async function checkLogic(game) {
  if (!game.content || !game.content.answer) return `MISSING answer`;
  return null;
}

async function checkNetwork(game) {
  const c = game.content || {};
  if (!Array.isArray(c.devices) || c.devices.length < 2) return `devices invalid`;
  if (!Array.isArray(c.connections)) return `connections missing`;
  return null;
}

async function checkSqlQuiz(game) {
  const qs = game.content && game.content.questions;
  if (!Array.isArray(qs) || qs.length === 0) return `questions missing`;
  for (const q of qs) {
    if (!q.question || !q.answer) return `question missing fields`;
  }
  return null;
}

async function checkThreat(game) {
  const c = game.content || {};
  if (!c.details && !c.question) return `no details or prompt`;
  return null;
}

async function main() {
  console.log('🔎 Running DB-driven game smoke tests...');
  const tracks = await prisma.track.findMany({ include: { games: true, modules: true } });
  let total = 0, failures = 0;
  for (const track of tracks) {
    console.log(`\nTrack: ${track.title} (modules=${track.modules.length}, games=${track.games.length})`);
    for (const mod of track.modules) {
      // basic module sanity
      if (typeof mod.order !== 'number') console.warn(`  - Module ${mod.id} missing order`);
    }

    for (const game of track.games) {
      total++;
      let err = null;
      switch (game.type) {
        case 'coding':
          err = await checkCoding(game);
          break;
        case 'logic':
          err = await checkLogic(game);
          break;
        case 'network':
          err = await checkNetwork(game);
          break;
        case 'sql-quiz':
          err = await checkSqlQuiz(game);
          break;
        case 'threat':
          err = await checkThreat(game);
          break;
        default:
          // allow unknowns but warn
          console.warn(`  - Game ${game.name} has unknown type '${game.type}', skipping strict checks.`);
      }

      if (err) {
        failures++;
        console.error(`  ✖ Game ${game.name} (type=${game.type}) failed: ${err}`);
      } else {
        console.log(`  ✓ Game ${game.name} (type=${game.type}) OK`);
      }
    }
  }

  console.log('\nSummary:');
  console.log(`  Total games checked: ${total}`);
  console.log(`  Failures: ${failures}`);
  await prisma.$disconnect();

  if (failures > 0) process.exit(2);
  process.exit(0);
}

main().catch(e => {
  console.error('Error during tests:', e);
  process.exit(1);
});
