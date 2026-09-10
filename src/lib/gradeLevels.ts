export const GRADE_LEVELS = [
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

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
