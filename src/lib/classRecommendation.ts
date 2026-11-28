import { formatDateTime } from "@/lib/datetime";
import { GRADE_LEVELS } from "@/lib/gradeLevels";

const MAX_TOPICS_LISTED = 3;

export interface RecommendedClassDetails {
  subject: string;
  code: string;
  gradeLevel: string | null;
  /** The tutor's anonymous ID (TUT-XXXX) — never a real name (RA 10173). */
  tutorAnonymousId: string | null;
  topics: string[];
  nextSessionAt: Date | null;
}

/**
 * The learner's notification for an admin recommendation: what the class is and when it next meets.
 * The admin's note is deliberately left out — the form promises it stays among admins.
 */
export function classRecommendationMessage(details: RecommendedClassDetails): string {
  const { subject, code, gradeLevel, tutorAnonymousId, topics, nextSessionAt } = details;
  const facts = [
    GRADE_LEVELS.find((grade) => grade.value === gradeLevel)?.label,
    tutorAnonymousId && `tutor ${tutorAnonymousId}`,
    topics.length > 0 && `topics: ${topics.slice(0, MAX_TOPICS_LISTED).join(", ")}${topics.length > MAX_TOPICS_LISTED ? ` and ${topics.length - MAX_TOPICS_LISTED} more` : ""}`,
  ].filter(Boolean);

  let message = `An administrator recommended the ${subject} class (${code}) for you`;
  message += facts.length > 0 ? ` — ${facts.join(", ")}.` : ".";
  message += nextSessionAt ? ` Next session: ${formatDateTime(nextSessionAt)}.` : " No upcoming session is scheduled yet.";
  return message;
}
