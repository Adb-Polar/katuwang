import type { Subject, Topic } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeTopic, SUBJECT_TOPICS } from "@/lib/subjectTopics";

// ─── Admin-editable subject / topic taxonomy ─────────────────────────────────
// DB-backed replacement for the static SUBJECT_TOPICS map. Cached in-process
// with a short TTL; the admin write routes call `invalidateSubjectCache()`.
// See docs/plans/subject-topic-management.md.

const CACHE_TTL_MS = 60_000;

export type SubjectWithTopics = Subject & { topics: Topic[] };

interface Cache {
  data: SubjectWithTopics[] | null;
  expires: number;
  inflight: Promise<SubjectWithTopics[]> | null;
}

const globalForSubjects = globalThis as unknown as { __ktSubjectCache?: Cache };
const cache: Cache =
  globalForSubjects.__ktSubjectCache ??
  (globalForSubjects.__ktSubjectCache = { data: null, expires: 0, inflight: null });

export function invalidateSubjectCache(): void {
  cache.data = null;
  cache.expires = 0;
  cache.inflight = null;
}

let warnedFallback = false;

/** Static SUBJECT_TOPICS shaped like the DB rows — used only if the DB read fails. */
function staticFallback(): SubjectWithTopics[] {
  const now = new Date();
  return (Object.keys(SUBJECT_TOPICS) as string[]).map((slug, i) => ({
    id: `static-${slug}`,
    slug,
    name: slug,
    order: i,
    active: true,
    createdAt: now,
    updatedAt: now,
    topics: SUBJECT_TOPICS[slug as keyof typeof SUBJECT_TOPICS].map((name, j) => ({
      id: `static-${slug}-${j}`,
      subjectId: `static-${slug}`,
      name,
      order: j,
      active: true,
      createdAt: now,
    })),
  }));
}

async function loadAll(): Promise<SubjectWithTopics[]> {
  if (cache.data && cache.expires > Date.now()) return cache.data;
  if (cache.inflight) return cache.inflight;

  cache.inflight = (async () => {
    try {
      const rows = await prisma.subject.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: { topics: { orderBy: [{ order: "asc" }, { name: "asc" }] } },
      });
      cache.data = rows;
      cache.expires = Date.now() + CACHE_TTL_MS;
      return rows;
    } catch (err) {
      // The taxonomy tables not being reachable (e.g. a unit test that mocks
      // prisma without `subject`) must not break validation — fall back to the
      // compile-time SUBJECT_TOPICS. Not cached, so a real DB recovers next call.
      if (!warnedFallback) {
        console.warn("[subjects] DB read failed, using static SUBJECT_TOPICS fallback:", err);
        warnedFallback = true;
      }
      return staticFallback();
    } finally {
      cache.inflight = null;
    }
  })();

  return cache.inflight;
}

/** All subjects (with their topics). `includeInactive` defaults to false. */
export async function getSubjects(
  opts: { includeInactive?: boolean } = {}
): Promise<SubjectWithTopics[]> {
  const all = await loadAll();
  if (opts.includeInactive) return all;
  return all
    .filter((s) => s.active)
    .map((s) => ({ ...s, topics: s.topics.filter((t) => t.active) }));
}

/** Topics for one subject slug. Empty array if the subject is unknown. */
export async function getTopics(
  subjectSlug: string,
  opts: { includeInactive?: boolean } = {}
): Promise<Topic[]> {
  const all = await loadAll();
  const subject = all.find((s) => s.slug === subjectSlug);
  if (!subject) return [];
  return opts.includeInactive ? subject.topics : subject.topics.filter((t) => t.active);
}

/** Slugs of the active subjects — handy for `z` refinements. */
export async function getSubjectSlugs(): Promise<string[]> {
  return (await getSubjects()).map((s) => s.slug);
}

export async function subjectExists(slug: string, opts: { includeInactive?: boolean } = {}): Promise<boolean> {
  const all = await loadAll();
  const s = all.find((x) => x.slug === slug);
  return !!s && (opts.includeInactive || s.active);
}

/**
 * Case-insensitive topic membership check (mirrors the old
 * `isKnownTopic(subject, topic)` from src/lib/subjectTopics.ts).
 */
export async function topicExists(
  subjectSlug: string,
  topicName: string,
  opts: { includeInactive?: boolean } = {}
): Promise<boolean> {
  const wanted = normalizeTopic(topicName).toLowerCase();
  const topics = await getTopics(subjectSlug, opts);
  return topics.some((t) => t.name.toLowerCase() === wanted);
}
