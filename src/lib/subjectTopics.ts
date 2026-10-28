import { SUBJECT_CATALOG } from "./subjectCatalog";



export const SUBJECT_TOPICS: Record<string, string[]> = Object.fromEntries(
  SUBJECT_CATALOG.map((subject) => [subject.slug, subject.topics.map((topic) => topic.name)]),
);

/** Subject slugs in catalogue order — the single derived list, no re-casting at call sites. */
export const SUBJECT_SLUGS: string[] = Object.keys(SUBJECT_TOPICS);

/**
 * Normalizes a user-typed topic: trims and collapses internal whitespace.
 * Custom topics are stored verbatim (after this pass), so keep it conservative.
 */
export function normalizeTopic(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** True when `topic` is one of the curated topics for `subject` (case-insensitive). */
export function isKnownTopic(subject: string, topic: string): boolean {
  const t = normalizeTopic(topic).toLowerCase();
  return (SUBJECT_TOPICS[subject] ?? []).some((k) => k.toLowerCase() === t);
}
