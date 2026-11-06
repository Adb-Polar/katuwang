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
 * An empty/null target grade means "Any grade" (open to learners of any grade).
 */
export function isTargetGradeEligibleForTutor(
  targetGrade: GradeLevel | string | null | undefined,
  tutorGrade: GradeLevel | string | null | undefined
): boolean {
  if (!targetGrade) return true;
  if (!tutorGrade) return false;
  return gradeNumber(targetGrade) <= gradeNumber(tutorGrade);
}

/** Learner access is unrestricted by grade; grade fit belongs in ranking/filtering. */
export const LEARNER_GRADE_ACCESS = "ANY_GRADE" as const;

export function isStudentEligibleForTutor(
  _studentGrade?: GradeLevel | string | null,
  _tutorGrade?: GradeLevel | string | null
): boolean {
  void _studentGrade; void _tutorGrade;
  return LEARNER_GRADE_ACCESS === "ANY_GRADE";
}

export function isStudentEligibleForClassTarget(
  _studentGrade?: GradeLevel | string | null,
  _targetGrade?: GradeLevel | string | null
): boolean {
  return isStudentEligibleForTutor(_studentGrade, _targetGrade);
}

export function isStudentEligibleForClass(
  studentGrade?: GradeLevel | string | null,
  tutorGrade?: GradeLevel | string | null,
  targetGrade?: GradeLevel | string | null
): boolean {
  return isStudentEligibleForTutor(studentGrade, tutorGrade) && isStudentEligibleForClassTarget(studentGrade, targetGrade);
}

/**
 * Returns available target grades for a tutor (tutor's grade and below).
 */
export function getEligibleTargetGrades(tutorGrade: GradeLevel | string | null | undefined) {
  if (!tutorGrade) return [];
  const max = gradeNumber(tutorGrade);
  return GRADE_LEVELS.filter((g) => gradeNumber(g.value) <= max);
}

/** Grade options for learner discovery and tutor request pools are unrestricted. */
export function getEligibleTutorGradesForStudent(_studentGrade?: GradeLevel | string | null): GradeLevel[] {
  void _studentGrade;
  return [...ALL_GRADE_LEVELS];
}

export function getEligibleClassTargetGradesForStudent(_studentGrade?: GradeLevel | string | null): GradeLevel[] {
  void _studentGrade;
  return [...ALL_GRADE_LEVELS];
}

export function getEligibleStudentGradesForTutor(_tutorGrade?: GradeLevel | string | null): GradeLevel[] {
  void _tutorGrade;
  return [...ALL_GRADE_LEVELS];
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

