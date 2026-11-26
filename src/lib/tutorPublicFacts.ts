import { gradeLabel } from "@/lib/gradeLevels";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { SCHOOL_TIME_ZONE } from "@/lib/datetime";

export interface TutorPublicFactsInput {
  gradeLevel: string;
  section: string | null;
  /** Subject slugs the tutor holds at least one certified topic in. */
  certifiedSubjects: string[];
  publishedClassCount: number;
  completedSessionCount: number;
  tutorSince: Date;
}

export interface TutorFact {
  label: string;
  value: string;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * What a learner may know about a tutor besides the anonymous ID: school placement and
 * teaching activity. Never a name, email, contact detail or LRN — see docs/reference/decisions.md
 * ("Tutor grade level and section are shown to learners").
 */
export function tutorPublicFacts(input: TutorPublicFactsInput): TutorFact[] {
  const subjects = [...new Set(input.certifiedSubjects)].map(subjectDisplayLabel).sort((a, b) => a.localeCompare(b));
  const since = new Intl.DateTimeFormat("en-PH", { timeZone: SCHOOL_TIME_ZONE, month: "long", year: "numeric" }).format(input.tutorSince);

  return [
    { label: "Grade level", value: gradeLabel(input.gradeLevel) },
    ...(input.section?.trim() ? [{ label: "Section", value: input.section.trim() }] : []),
    { label: "Certified subjects", value: subjects.length ? subjects.join(", ") : "None yet" },
    { label: "Classes offered", value: plural(input.publishedClassCount, "class", "classes") },
    { label: "Sessions completed", value: plural(input.completedSessionCount, "session", "sessions") },
    { label: "Tutor since", value: since },
  ];
}
