import { SUBJECT_CATALOG, catalogGrades } from "./subjectCatalog";

export const JUNIOR_HIGH_GRADES = ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10"] as const;
/** Availability of the approved broad groups; individual topics retain their own grade lists. */
export const SUBJECT_GRADE_DEFAULTS: Record<string, readonly string[]> = Object.fromEntries(SUBJECT_CATALOG.map((s) => [s.slug, s.gradeLevels]));
export function defaultSubjectGrades(slug: string): string[] | undefined { return catalogGrades(slug); }
