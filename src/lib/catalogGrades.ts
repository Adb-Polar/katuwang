/** Unassigned legacy entries apply to every grade. Topic grades also obey their parent. */
export function availableInGrade(grades: unknown, grade?: string): boolean {
  return !grade || !Array.isArray(grades) || grades.length === 0 || grades.includes(grade);
}
export interface GradedSubject {
  slug: string;
  gradeLevels?: unknown;
  topics: string[];
  topicGrades?: Record<string, unknown>;
}
export function subjectsInGrade<T extends GradedSubject>(subjects: T[], grade?: string): T[] {
  return subjects.filter((s) => availableInGrade(s.gradeLevels, grade));
}
export function topicsInGrade(subject: GradedSubject | undefined, grade?: string): string[] {
  if (!subject || !availableInGrade(subject.gradeLevels, grade)) return [];
  return subject.topics.filter((topic) => availableInGrade(subject.topicGrades?.[topic], grade));
}
