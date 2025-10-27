const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const lessonsByType = {
  coding: [
    {
      title: 'Introduction to the Challenge',
      subtitle: 'Understand the problem and starter code',
      body: `
        <p>This lesson walks you through the coding challenge, explains the objectives, and shows the starter code you'll modify.</p>
        <pre><code>// Starter code example
function greet(name) {
  // TODO: implement
}
</code></pre>
        <p>Make sure to read the tests and constraints before you begin.</p>
      `,
      resources: [
        { title: 'JavaScript Guide (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' }
      ],
      estimatedMinutes: 10
    },
    {
      title: 'Hints & Common Pitfalls',
      subtitle: 'Tips to successfully complete the task',
      body: '<p>Consider edge cases like empty input and large numbers. Think about time complexity.</p>',
      resources: [],
      estimatedMinutes: 5
    }
  ],
  network: [
    {
      title: 'Network Topology Basics',
      subtitle: 'Devices and connections overview',
      body: '<p>Learn about routers, switches, and basic topology design. You will build a small network in the interactive panel.</p>',
      resources: [
        { title: 'Intro to Networking', url: 'https://www.cloudflare.com/learning/network-layer/what-is-a-router/' }
      ],
      estimatedMinutes: 8
    }
  ],
  threat: [
    {
      title: 'Threat Modelling Overview',
      subtitle: 'Identify common attack vectors',
      body: '<p>Read the scenario carefully and list potential vulnerabilities. Use the submission panel to report your findings.</p>',
      resources: [
        { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' }
      ],
      estimatedMinutes: 7
    }
  ],
  'sql-quiz': [
    {
      title: 'SQL Refresher',
      subtitle: 'Common SELECT patterns',
      body: '<p>This lesson reviews basic SQL SELECT syntax and joins you will use in the quiz.</p>',
      resources: [
        { title: 'SQL Tutorial', url: 'https://www.w3schools.com/sql/' }
      ],
      estimatedMinutes: 6
    }
  ],
  default: [
    {
      title: 'Module Overview',
      subtitle: 'What you will learn',
      body: '<p>This module covers the topic and provides an interactive experience.</p>',
      resources: [],
      estimatedMinutes: 5
    }
  ]
};

(async function main() {
  console.log('🔧 Seeding lessons into modules (idempotent)...');
  try {
  // include track title so we can choose lessons by track domain
  const modules = await prisma.module.findMany({ select: { id: true, type: true, content: true, track: { select: { title: true } } } });
  console.log(`Found ${modules.length} modules`);

    let seededCount = 0;
    for (const mod of modules) {
      const existingContent = mod.content || {};
      const existingLessons = Array.isArray(existingContent.lessons) ? existingContent.lessons : [];

      // determine desired lesson bucket: prefer track title hints, fallback to game/module type
      const trackTitle = (mod.track && mod.track.title) ? String(mod.track.title).toLowerCase() : '';
      let sampleKey = null;
      if (trackTitle.includes('network') || trackTitle.includes('networking')) sampleKey = 'network';
      else if (trackTitle.includes('security') || trackTitle.includes('cyber') || trackTitle.includes('cybersecurity') || trackTitle.includes('threat')) sampleKey = 'threat';
      else if (trackTitle.includes('database') || trackTitle.includes('db')) sampleKey = 'sql-quiz';
      else if (trackTitle.includes('software') || trackTitle.includes('development') || trackTitle.includes('coding')) sampleKey = 'coding';
      else sampleKey = mod.type || 'default';

      const sample = lessonsByType[sampleKey] || lessonsByType.default;

      // if there are no existing lessons, or the existing is just the generic placeholder, then seed/overwrite
      const hasPlaceholder = existingLessons.length === 1 && existingLessons[0] && existingLessons[0].title === 'Module Overview';
      if (existingLessons.length > 0 && !hasPlaceholder) {
        console.log(`- Skipping module ${mod.id} (${mod.type}) — already has ${existingLessons.length} lesson(s)`);
        continue;
      }

      existingContent.lessons = sample;

      await prisma.module.update({ where: { id: mod.id }, data: { content: existingContent } });
      console.log(`- Seeded ${sample.length} lesson(s) into module ${mod.id} (${mod.type}) [track: ${trackTitle || 'unknown'}]`);
      seededCount++;
    }

    console.log(`✅ Lesson seeding complete. Modules updated: ${seededCount}`);
  } catch (err) {
    console.error('Error seeding lessons:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
