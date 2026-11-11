import data from "./verifiedSubjectCatalog.json";
import type { GradeLevel } from "@prisma/client";

export type CatalogAssociation = {
  gradeLevel: string; sourceUrl: string; curriculumVersion: string; gradeEvidenceUrl: string;
  track: string | null; strand: string | null; cluster?: string | null; pdfPage?: number;
};
export type CatalogEvidence = {
  status: string; note: string; reviewedAt: string; sources: { title: string; url: string }[];
  associations?: CatalogAssociation[]; track?: string; strand?: string | null;
  cluster?: string | null; curriculumVersion?: string;
};
export type CatalogTopic = {
  name: string; gradeLevels: string[]; curriculum: CatalogEvidence & { associations: CatalogAssociation[] };
};
export type CatalogSubject = {
  slug: string; name: string; order: number; gradeLevels: string[]; curriculum: CatalogEvidence; topics: CatalogTopic[];
};
export const SUBJECT_CATALOG: CatalogSubject[] = data;
export const SUBJECT_NAMES: Record<string, string> = Object.fromEntries(data.map((s) => [s.slug, s.name]));
export function catalogEntry(slug: string, topic?: string) {
  const subject = data.find((s) => s.slug === slug);
  return topic === undefined ? subject : subject?.topics.find((t) => t.name === topic);
}
export function catalogGrades(slug: string): GradeLevel[] | undefined {
  const subject = data.find((s) => s.slug === slug);
  return subject ? [...subject.gradeLevels] as GradeLevel[] : undefined;
}
