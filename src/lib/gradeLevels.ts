import type { GradeLevel } from "@prisma/client";

export const GRADE_LEVELS = [
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
] as const;

export const ALL_GRADE_LEVELS: GradeLevel[] = [
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
];

export const GRADE_ORDER: Record<GradeLevel, number> = {
  GRADE_7: 7,
  GRADE_8: 8,
  GRADE_9: 9,
  GRADE_10: 10,
  GRADE_11: 11,
  GRADE_12: 12,
};

/**
 * Extracts numeric grade from a GradeLevel enum or string (e.g. "GRADE_9" -> 9).
 */
export function gradeNumber(grade: GradeLevel | string | null | undefined): number {
  if (!grade) return 0;
  if (grade in GRADE_ORDER) {
    return GRADE_ORDER[grade as GradeLevel];
  }
  const match = String(grade).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Compares two grade levels. Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareGradeLevels(
  a: GradeLevel | string | null | undefined,
  b: GradeLevel | string | null | undefined
): number {
  return gradeNumber(a) - gradeNumber(b);
}

/**
 * Business Rule: Tutor can only select target grades that are <= tutor's grade.
 * An empty/null target grade means "Any grade" (open to all eligible students <= tutor).
 */
export function isTargetGradeEligibleForTutor(
  targetGrade: GradeLevel | string | null | undefined,
  tutorGrade: GradeLevel | string | null | undefined
): boolean {
  if (!targetGrade) return true;
  if (!tutorGrade) return false;
  return gradeNumber(targetGrade) <= gradeNumber(tutorGrade);
}

/**
 * Business Rule: Tutor can only teach students in the same or lower grade level.
 * `studentGrade <= tutorGrade`
 */
export function isStudentEligibleForTutor(
  studentGrade: GradeLevel | string | null | undefined,
  tutorGrade: GradeLevel | string | null | undefined
): boolean {
  if (!studentGrade || !tutorGrade) return false;
  return gradeNumber(studentGrade) <= gradeNumber(tutorGrade);
}

/**
 * Business Rule: Student can only enroll if studentGrade <= targetGrade.
 * An empty/null target grade imposes no target restriction.
 */
export function isStudentEligibleForClassTarget(
  studentGrade: GradeLevel | string | null | undefined,
  targetGrade: GradeLevel | string | null | undefined
): boolean {
  if (!targetGrade) return true;
  if (!studentGrade) return false;
  return gradeNumber(studentGrade) <= gradeNumber(targetGrade);
}

/**
 * Full Class Eligibility Rule:
 * 1. studentGrade <= tutorGrade
 * 2. studentGrade <= targetGrade (if targetGrade specified)
 */
export function isStudentEligibleForClass(
  studentGrade: GradeLevel | string | null | undefined,
  tutorGrade: GradeLevel | string | null | undefined,
  targetGrade?: GradeLevel | string | null
): boolean {
  return (
    isStudentEligibleForTutor(studentGrade, tutorGrade) &&
    isStudentEligibleForClassTarget(studentGrade, targetGrade)
  );
}

/**
 * Returns available target grades for a tutor (tutor's grade and below).
 */
export function getEligibleTargetGrades(tutorGrade: GradeLevel | string | null | undefined) {
  if (!tutorGrade) return [];
  const max = gradeNumber(tutorGrade);
  return GRADE_LEVELS.filter((g) => gradeNumber(g.value) <= max);
}

/**
 * Returns tutor grade levels that can teach a student of `studentGrade` (grades >= studentGrade).
 */
export function getEligibleTutorGradesForStudent(
  studentGrade: GradeLevel | string | null | undefined
): GradeLevel[] {
  if (!studentGrade) return [];
  const min = gradeNumber(studentGrade);
  return ALL_GRADE_LEVELS.filter((g) => gradeNumber(g) >= min);
}

/**
 * Returns class target grade levels that a student of `studentGrade` can enroll in (target grades >= studentGrade).
 */
export function getEligibleClassTargetGradesForStudent(
  studentGrade: GradeLevel | string | null | undefined
): GradeLevel[] {
  if (!studentGrade) return [];
  const min = gradeNumber(studentGrade);
  return ALL_GRADE_LEVELS.filter((g) => gradeNumber(g) >= min);
}

/**
 * Returns student grade levels that a tutor of `tutorGrade` can teach (grades <= tutorGrade).
 */
export function getEligibleStudentGradesForTutor(
  tutorGrade: GradeLevel | string | null | undefined
): GradeLevel[] {
  if (!tutorGrade) return [];
  const max = gradeNumber(tutorGrade);
  return ALL_GRADE_LEVELS.filter((g) => gradeNumber(g) <= max);
}

/**
 * Display form of a `GradeLevel` enum value: `"GRADE_10"` → `"GRADE 10"`.
 * The one place to change if the app ever wants `"Grade 10"` or `"G10"`.
 * Replaces the ~12 hand-written `gradeLevel.replace("_", " ")` call sites
 * (which only swapped the first underscore).
 */
export function gradeLabel(grade: string): string {
  return grade.replace(/_/g, " ");
}

/** `"GRADE 10 · Rizal"` — the grade + section pair rendered across roster/detail views. */
export function gradeSection(grade: string, section: string): string {
  return `${gradeLabel(grade)} · ${section}`;
}

