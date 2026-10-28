import type { PrismaClient } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";

/** Replace active choices only. Archived rows and their historical references are never deleted. */
export async function seedSubjectCatalog(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await tx.subject.updateMany({ data: { active: false } });
    await tx.topic.updateMany({ data: { active: false } });
    for (const entry of SUBJECT_CATALOG) {
      const { topics, ...details } = entry;
      const subject = await tx.subject.upsert({ where: { slug: entry.slug }, update: { ...details, active: true }, create: { ...details, active: true } });
      for (const [order, topic] of topics.entries()) {
        await tx.topic.upsert({ where: { subjectId_name: { subjectId: subject.id, name: topic.name } },
          update: { ...topic, order, active: true }, create: { ...topic, subjectId: subject.id, order, active: true } });
      }
    }
  }, { timeout: 30000 });
  return { totalSubjectsUpserted: SUBJECT_CATALOG.length, totalTopicsUpserted: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0) };
}
