import type { Prisma, PrismaClient } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";
import { validateCurriculumCatalog } from "../src/lib/validateCurriculumCatalog";

/** Only catalog rows change. Historical string references and all IDs remain intact. */
export async function seedSubjectCatalog(prisma: PrismaClient) {
  return prisma.$transaction(applySubjectCatalog, { timeout: 180000 });
}

/** Shared transaction body for catalog + question-bank replacement. */
export async function applySubjectCatalog(tx: Prisma.TransactionClient) {
  validateCurriculumCatalog(SUBJECT_CATALOG);
  const oldSubjects = await tx.subject.findMany({ include: { topics: true } });
  const expectedSlugs = SUBJECT_CATALOG.map((s) => s.slug);
  await tx.topic.updateMany({ where: { subject: { slug: { notIn: expectedSlugs } } }, data: { active: false } });
  await tx.subject.updateMany({ where: { slug: { notIn: expectedSlugs } }, data: { active: false } });
  let reusedTopics = 0;
  for (const entry of SUBJECT_CATALOG) {
    const { topics, ...details } = entry;
    const old = oldSubjects.find((s) => s.slug === entry.slug);
    const curriculum = { ...details.curriculum, catalogRevision: "deped-2026-11-11" };
    const subject = await tx.subject.upsert({
      where: { slug: entry.slug },
      update: { ...details, curriculum },
      create: { ...details, curriculum, active: true },
    });
    await tx.topic.updateMany({ where: { subjectId: subject.id, name: { notIn: topics.map((t) => t.name) } }, data: { active: false } });
    for (const [order, topic] of topics.entries()) {
      const prior = old?.topics.find((t) => t.name.toLocaleLowerCase() === topic.name.toLocaleLowerCase());
      if (prior) reusedTopics++;
      const data = { ...topic, order, curriculum: { ...topic.curriculum, catalogRevision: "deped-2026-11-11" } };
      await tx.topic.upsert({
        where: { subjectId_name: { subjectId: subject.id, name: topic.name } },
        update: data,
        create: { ...data, subjectId: subject.id, active: true },
      });
    }
  }
  return {
    totalSubjectsUpserted: SUBJECT_CATALOG.length,
    totalTopicsUpserted: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0),
    gradeAssociations: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.gradeLevels.length, 0), 0), reusedTopics,
  };
}
