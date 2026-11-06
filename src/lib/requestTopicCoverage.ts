import { normalizeTopic } from "@/lib/subjectTopics";

/** Every requested topic must be represented; additional certified topics are allowed. */
export function missingRequestedTopics(requested: string[], proposed: string[]): string[] {
  const covered = new Set(proposed.map(topic => normalizeTopic(topic).toLowerCase()));
  return requested.filter(topic => !covered.has(normalizeTopic(topic).toLowerCase()));
}
