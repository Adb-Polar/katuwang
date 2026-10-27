/**
 * Subject-level defaults for the seven existing junior-high learning areas.
 * Verified against DepEd MATATAG / K–12 guides on 2026-10-27.
 * See docs/reference/subject-grade-mapping.md for sources and SHS boundaries.
 * These are learning-area assignments, not grade-specific topic competencies.
 */
export const JUNIOR_HIGH_GRADES = ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10"] as const;

export const SUBJECT_GRADE_DEFAULTS: Record<string, readonly string[]> = {
  MATH: JUNIOR_HIGH_GRADES,
  ENGLISH: JUNIOR_HIGH_GRADES,
  SCIENCE: JUNIOR_HIGH_GRADES,
  FILIPINO: JUNIOR_HIGH_GRADES,
  ARALING_PANLIPUNAN: JUNIOR_HIGH_GRADES,
  TLE: JUNIOR_HIGH_GRADES,
  MAPEH: JUNIOR_HIGH_GRADES,
};

/** Return a copy: callers cannot mutate the shared curriculum defaults. */
export function defaultSubjectGrades(slug: string): string[] | undefined {
  const grades = SUBJECT_GRADE_DEFAULTS[slug];
  return grades ? [...grades] : undefined;
}
