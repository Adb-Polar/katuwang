import data from "./approvedSubjectCatalog.json";
import type { GradeLevel } from "@prisma/client";

export const SUBJECT_CATALOG = data;
export const SUBJECT_NAMES: Record<string, string> = Object.fromEntries(data.map((s) => [s.slug, s.name]));
export function catalogEntry(slug: string, topic?: string) {
  const subject = data.find((s) => s.slug === slug);
  return topic === undefined ? subject : subject?.topics.find((t) => t.name === topic);
}
export function catalogGrades(slug: string): GradeLevel[] | undefined {
  const subject = data.find((s) => s.slug === slug);
  return subject ? [...subject.gradeLevels] as GradeLevel[] : undefined;
}
