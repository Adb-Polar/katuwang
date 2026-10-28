import type { GradeLevel } from "@prisma/client";
import data from "./curriculumData.json";

export const CURRICULUM_GRADES: GradeLevel[] = ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"];
export const CURRICULUM_SOURCES = data.sources;
export interface CurriculumMapping {
  gradeLevels: GradeLevel[];
  status: string;
  note: string;
  sourceIds: string[];
  reviewedAt: string;
  schoolYear: string;
}
const catalog = data.subjects as unknown as Record<string, {
  subject: CurriculumMapping;
  topics: Record<string, CurriculumMapping>;
}>;

/** Unknown/custom entries stay unassigned until an admin supplies evidence. */
export function curriculumFor(slug: string, topic?: string) {
  const mapping = topic === undefined ? catalog[slug]?.subject : catalog[slug]?.topics[topic];
  if (!mapping) return { gradeLevels: [] as GradeLevel[], curriculum: undefined };
  const { gradeLevels, ...evidence } = mapping;
  return {
    gradeLevels: [...gradeLevels],
    curriculum: {
      ...evidence,
      sources: evidence.sourceIds.map((id) => CURRICULUM_SOURCES[id as keyof typeof CURRICULUM_SOURCES]),
    },
  };
}

export function readGradeLevels(value: unknown): GradeLevel[] {
  if (!Array.isArray(value)) return [];
  return CURRICULUM_GRADES.filter((grade) => value.includes(grade));
}

export function gradeCoverageLabel(value: unknown): string {
  const grades = readGradeLevels(value);
  return grades.length ? `Grades ${grades.map((g) => g.replace("GRADE_", "")).join(", ")}` : "Grades not assigned";
}

/** Admin changes replace the research attribution so changed grades never retain stale evidence. */
export function adminCurriculumNote(note?: string) {
  return { status: "admin", note: note || "Grade coverage assigned by an administrator; verify against the school curriculum.", reviewedAt: new Date().toISOString().slice(0, 10), sources: [] };
}
