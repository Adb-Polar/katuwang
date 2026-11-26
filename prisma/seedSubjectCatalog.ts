import type { Prisma, PrismaClient } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";
import { validateCurriculumCatalog } from "../src/lib/validateCurriculumCatalog";
import { SEED_TRANSACTION_TIMEOUT_MS } from "./seedTransaction";

const CATALOG_REVISION = "deped-2026-11-11";

/** Only catalog rows change. Historical string references and all IDs remain intact. */
export async function seedSubjectCatalog(prisma: PrismaClient) {
  return prisma.$transaction(applySubjectCatalog, { timeout: SEED_TRANSACTION_TIMEOUT_MS });
}

/** Order-independent JSON, so a value read back from the database compares equal to the one written. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * Shared transaction body for catalog + question-bank replacement.
 *
 * Every statement is a network round trip inside one transaction, so topics are written in
 * bulk: new ones with one `createMany` per subject, existing ones only when they differ.
 * (One upsert per topic took over three minutes against a remote database.)
 */
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
    const curriculum = { ...details.curriculum, catalogRevision: CATALOG_REVISION };
    const subject = await tx.subject.upsert({
      where: { slug: entry.slug },
      update: { ...details, curriculum },
      create: { ...details, curriculum, active: true },
    });
    const existingTopics = old?.topics ?? [];
    if (existingTopics.length > 0) {
      await tx.topic.updateMany({ where: { subjectId: subject.id, name: { notIn: topics.map((t) => t.name) } }, data: { active: false } });
    }

    const newTopics: Prisma.TopicCreateManyInput[] = [];
    for (const [order, topic] of topics.entries()) {
      const data = { ...topic, order, curriculum: { ...topic.curriculum, catalogRevision: CATALOG_REVISION } };
      // Names are unique per subject without regard to case, as the database compares them.
      const prior = existingTopics.find((t) => t.name.toLocaleLowerCase() === topic.name.toLocaleLowerCase());
      if (!prior) {
        newTopics.push({ ...data, subjectId: subject.id, active: true });
        continue;
      }
      reusedTopics++;
      const unchanged =
        prior.name === data.name &&
        prior.order === data.order &&
        canonicalJson(prior.gradeLevels) === canonicalJson(data.gradeLevels) &&
        canonicalJson(prior.curriculum) === canonicalJson(data.curriculum);
      // `active` is never written here: a topic an administrator disabled stays disabled.
      if (!unchanged) await tx.topic.update({ where: { id: prior.id }, data });
    }
    if (newTopics.length > 0) await tx.topic.createMany({ data: newTopics });
  }
  return {
    totalSubjectsUpserted: SUBJECT_CATALOG.length,
    totalTopicsUpserted: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0),
    gradeAssociations: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.gradeLevels.length, 0), 0), reusedTopics,
  };
}
