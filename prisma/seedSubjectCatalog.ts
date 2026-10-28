import type { PrismaClient, Prisma } from "@prisma/client";
import { isDeepStrictEqual } from "node:util";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";

/** Replace active choices without deleting historical rows. Batch topic writes for remote databases. */
export async function seedSubjectCatalog(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await tx.subject.updateMany({ data: { active: false } });
    await tx.topic.updateMany({ data: { active: false } });
    const subjects = [];
    for (const entry of SUBJECT_CATALOG) {
      const { topics, ...details } = entry;
      const subject = await tx.subject.upsert({ where: { slug: entry.slug }, update: { ...details, active: true }, create: { ...details, active: true } });
      subjects.push({ subject, topics });
    }
    const existing = await tx.topic.findMany({ where: { subjectId: { in: subjects.map((s) => s.subject.id) } } });
    const byKey = new Map(existing.map((t) => [`${t.subjectId}::${t.name}`, t]));
    const inserts: Prisma.TopicCreateManyInput[] = [];
    const activeIds: string[] = [];
    for (const { subject, topics } of subjects) {
      for (const [order, topic] of topics.entries()) {
        const old = byKey.get(`${subject.id}::${topic.name}`);
        if (!old) inserts.push({ ...topic, subjectId: subject.id, order, active: true });
        else {
          activeIds.push(old.id);
          if (old.order !== order || !isDeepStrictEqual(old.gradeLevels, topic.gradeLevels) || !isDeepStrictEqual(old.curriculum, topic.curriculum)) {
            await tx.topic.update({ where: { id: old.id }, data: { ...topic, order } });
          }
        }
      }
    }
    if (inserts.length) await tx.topic.createMany({ data: inserts });
    if (activeIds.length) await tx.topic.updateMany({ where: { id: { in: activeIds } }, data: { active: true } });
  }, { timeout: 180000 });
  return { totalSubjectsUpserted: SUBJECT_CATALOG.length, totalTopicsUpserted: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0) };
}
