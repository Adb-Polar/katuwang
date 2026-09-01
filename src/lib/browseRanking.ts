import { GradeLevel } from "@prisma/client";
import { gradeMatchFor } from "@/lib/matching";

/**
 * Default ordering for the learner class-browse list ("what to show first").
 *
 * This is a *criteria-free* rank — the browse page has no subject/topic form to
 * match against — so it leans on lightweight signals: the learner's grade, the
 * subjects/topics they've shown interest in (past enrolments + open topic
 * requests), how soon the next session is, and whether seats are left. When the
 * learner applies an explicit search/subject/grade filter the route skips this
 * and falls back to newest-first.
 */

const WEIGHTS = {
  gradeExact: 6,
  gradeAdjacent: 3,
  gradeAny: 2,
  interestSubject: 8, // class subject is one the learner has engaged with
  interestTopic: 3, // per class topic that overlaps an interest topic
  soonnessMax: 4, // full points for a session today, decaying to 0 over the horizon
  hasSeats: 1,
} as const;

const SOONNESS_HORIZON_DAYS = 14;

export interface BrowseRankContext {
  gradeLevel: GradeLevel | null;
  interestSubjects: Set<string>;
  interestTopics: Set<string>;
}

export interface RankableClass {
  subject: string;
  gradeLevel: GradeLevel | null;
  topics: string[];
  maxStudents: number;
  createdAt: Date | string;
  sessions: { scheduledAt: Date | string; status: string }[];
  _count: { enrollments: number };
}

function nextSessionMs(klass: RankableClass, now: Date): number {
  const upcoming = klass.sessions
    .filter((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt).getTime() > now.getTime())
    .map((s) => new Date(s.scheduledAt).getTime())
    .sort((a, b) => a - b);
  return upcoming[0] ?? Infinity;
}

export function scoreBrowseClass(ctx: BrowseRankContext, klass: RankableClass, now: Date): number {
  const grade = gradeMatchFor(ctx.gradeLevel, klass.gradeLevel);
  const gradeScore =
    grade === "exact"
      ? WEIGHTS.gradeExact
      : grade === "adjacent"
      ? WEIGHTS.gradeAdjacent
      : grade === "any"
      ? WEIGHTS.gradeAny
      : 0;

  const subjectScore = ctx.interestSubjects.has(klass.subject) ? WEIGHTS.interestSubject : 0;
  const topicScore =
    klass.topics.filter((t) => ctx.interestTopics.has(t)).length * WEIGHTS.interestTopic;

  const nextMs = nextSessionMs(klass, now);
  const daysUntilNext =
    nextMs === Infinity ? Infinity : (nextMs - now.getTime()) / (1000 * 60 * 60 * 24);
  const soonness =
    daysUntilNext >= SOONNESS_HORIZON_DAYS || daysUntilNext === Infinity
      ? 0
      : WEIGHTS.soonnessMax * (1 - Math.max(0, daysUntilNext) / SOONNESS_HORIZON_DAYS);

  const seatsScore = klass._count.enrollments < klass.maxStudents ? WEIGHTS.hasSeats : 0;

  return Math.round((gradeScore + subjectScore + topicScore + soonness + seatsScore) * 100) / 100;
}

/** Stable sort: score desc, then newest first. Returns a new array. */
export function rankBrowseClasses<T extends RankableClass>(
  ctx: BrowseRankContext,
  classes: T[],
  now: Date = new Date()
): T[] {
  return classes
    .map((klass) => ({ klass, score: scoreBrowseClass(ctx, klass, now) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.klass.createdAt).getTime() - new Date(a.klass.createdAt).getTime();
    })
    .map((r) => r.klass);
}
