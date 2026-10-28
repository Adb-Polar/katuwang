import type { GradeLevel } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";

export function seedGrades(subject: string, topics: string[]): GradeLevel[] {
  const group = SUBJECT_CATALOG.find((s) => s.slug === subject);
  if (!group || !topics.length) throw new Error(`Unknown or empty seed subject: ${subject}`);
  const entries = topics.map((name) => {
    const topic = group.topics.find((t) => t.name === name);
    if (!topic) throw new Error(`Unknown seed topic: ${subject} / ${name}`);
    return topic;
  });
  const grades = group.gradeLevels.filter((g) => entries.every((t) => t.gradeLevels.includes(g)));
  if (!grades.length) throw new Error(`Seed topics have no common grade: ${subject} / ${topics.join(", ")}`);
  return grades as GradeLevel[];
}
export function seedGrade(subject: string, topics: string[], preferred?: GradeLevel | null): GradeLevel {
  const grades = seedGrades(subject, topics);
  return preferred && grades.includes(preferred) ? preferred : grades[0];
}
export function seedTopicsForGrade(subject: string, grade: GradeLevel): string[] {
  return SUBJECT_CATALOG.find((s) => s.slug === subject)?.topics.filter((t) => t.gradeLevels.includes(grade)).map((t) => t.name) ?? [];
}
