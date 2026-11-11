import verifiedData from "@/lib/verifiedSubjectCatalog.json";
import data from "@/lib/approvedSubjectCatalog.json";
import type { SubjectWithTopics } from "@/lib/subjects";
/** Test-only database rows. Route tests explicitly provide these through Prisma mocks. */
export function catalogFixture(): SubjectWithTopics[] {
  const createdAt = new Date("2026-01-01T00:00:00Z");
  return data.map(subject => ({
    id: `fixture-${subject.slug}`, slug: subject.slug, name: subject.name, order: subject.order,
    active: true, gradeLevels: subject.gradeLevels, curriculum: subject.curriculum, createdAt, updatedAt: createdAt,
    topics: subject.topics.map((topic, order) => ({ id: `fixture-${subject.slug}-${order}`, subjectId: `fixture-${subject.slug}`, name: topic.name, order, active: true, gradeLevels: topic.gradeLevels, curriculum: topic.curriculum, createdAt })),
  }));
}

/** Current official-source catalog for tests of the new selection contract. */
export function verifiedCatalogFixture(): SubjectWithTopics[] {
  const createdAt = new Date("2026-11-11T00:00:00Z");
  return verifiedData.map(subject => ({
    ...subject, id: `verified-${subject.slug}`, active: true, createdAt, updatedAt: createdAt,
    topics: subject.topics.map((topic, order) => ({ ...topic, id: `verified-${subject.slug}-${order}`, subjectId: `verified-${subject.slug}`, order, active: true, createdAt })),
  }));
}
