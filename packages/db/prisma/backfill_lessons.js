const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔁 Backfilling lessons from module.content.lessons into Lesson table (idempotent)');
  try {
    const modules = await prisma.module.findMany({ select: { id: true, content: true } });
    console.log(`Found ${modules.length} modules`);

    let created = 0;
    let skipped = 0;

    for (const mod of modules) {
      const content = mod.content || {};
      const lessons = Array.isArray(content.lessons) ? content.lessons : [];
      if (!lessons.length) {
        // nothing to backfill
        continue;
      }

      // check if module already has lessons in the DB
      const dbLessonsCount = await prisma.lesson.count({ where: { moduleId: mod.id } });
      if (dbLessonsCount > 0) {
        console.log(`- Skipping module ${mod.id} — ${dbLessonsCount} lesson(s) already present in DB`);
        skipped++;
        continue;
      }

      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i] || {};
        const title = l.title || `Lesson ${i + 1}`;
        const subtitle = l.subtitle || null;
        const body = (typeof l.body === 'string') ? { html: l.body } : (l.body || {});
        const resources = Array.isArray(l.resources) ? l.resources : (l.resources ? [l.resources] : null);
        const estimatedMins = l.estimatedMinutes || l.estimatedMins || null;

        // idempotency: if a lesson with same moduleId + title + order exists, skip
        const exists = await prisma.lesson.findFirst({ where: { moduleId: mod.id, title: title, order: i } });
        if (exists) {
          console.log(`  - Lesson exists: ${title} (module ${mod.id})`);
          continue;
        }

        await prisma.lesson.create({ data: {
          moduleId: mod.id,
          title,
          subtitle,
          body,
          resources,
          order: i,
          estimatedMins,
        }});

        created++;
        console.log(`  + Created lesson '${title}' for module ${mod.id}`);
      }

      // mark module content as migrated so future runs can be quick; keep lessons in JSON as fallback
      const updatedContent = { ...content, lessons_migrated: true };
      await prisma.module.update({ where: { id: mod.id }, data: { content: updatedContent } });
    }

    console.log(`\n✅ Backfill complete — lessons created: ${created}, modules skipped (already had lessons): ${skipped}`);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
