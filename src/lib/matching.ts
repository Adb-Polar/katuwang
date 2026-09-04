import { GradeLevel } from "@prisma/client";

// ─── Scoring weights (tunable, kept explicit for transparency in the UI) ──────
const WEIGHTS = {
  topicMatch: 10, // per requested topic the class also covers
  verifiedTopicMatch: 5, // extra, per matched topic the tutor is CERTIFIED for
  scheduleFit: 3, // per upcoming session that lands inside a preferred slot
  gradeExact: 6, // class targets exactly the learner's grade
  gradeAdjacent: 3, // class targets a grade within one of the learner's
  gradeAny: 2, // class has no target grade (open to anyone)
  soonnessMax: 2, // tiebreak: full points for a session today, decaying over 14 days
} as const;

const SOONNESS_HORIZON_DAYS = 14;

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export interface PreferredSlot {
  day: string; // "MONDAY".."SUNDAY"
  startTime: string; // "HH:MM" 24h
  endTime: string; // "HH:MM" 24h
}

export interface SessionForMatching {
  scheduledAt: Date | string;
  duration: number;
  status: string; // SessionStatus
}

export interface ClassForMatching {
  id: string;
  subject: string; // subject slug
  gradeLevel: GradeLevel | null;
  topics: string[];
  /** Topics (within this class's subject) the teaching tutor holds a CERTIFIED certification for. */
  verifiedTopics: string[];
  sessions: SessionForMatching[];
  maxStudents: number;
  enrollmentCount: number;
  status: string; // ClassStatus
  published: boolean;
}

export interface MatchCriteria {
  subject: string; // subject slug
  topics: string[];
  gradeLevel?: GradeLevel | null;
  preferredSlots?: PreferredSlot[];
  /** "SOLO" restricts to 1-on-1 classes, "GROUP" to multi-seat; "ANY"/undefined = no filter. */
  classFormat?: "SOLO" | "GROUP" | "ANY";
}

export type GradeMatch = "exact" | "adjacent" | "any" | "none";

export interface MatchReasons {
  matchedTopics: string[];
  verifiedMatchedTopics: string[];
  scheduleFitCount: number;
  gradeMatch: GradeMatch;
}

export interface MatchResult<T extends ClassForMatching = ClassForMatching> {
  class: T;
  score: number;
  reasons: MatchReasons;
}

function gradeNumber(grade: GradeLevel): number {
  return Number(grade.replace("GRADE_", ""));
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function upcomingScheduledSessions(klass: ClassForMatching, now: Date): Date[] {
  return klass.sessions
    .filter((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt).getTime() > now.getTime())
    .map((s) => new Date(s.scheduledAt))
    .sort((a, b) => a.getTime() - b.getTime());
}

/** Does a session start on a preferred day and within a preferred time window? */
function sessionFitsAnySlot(start: Date, slots: PreferredSlot[]): boolean {
  const startMin = start.getHours() * 60 + start.getMinutes();
  return slots.some(
    (slot) =>
      DAY_INDEX[slot.day] === start.getDay() &&
      startMin >= toMinutes(slot.startTime) &&
      startMin < toMinutes(slot.endTime)
  );
}

export function gradeMatchFor(
  criteriaGrade: GradeLevel | null | undefined,
  classGrade: GradeLevel | null
): GradeMatch {
  if (classGrade == null) return "any";
  if (!criteriaGrade) return "none";
  const diff = Math.abs(gradeNumber(criteriaGrade) - gradeNumber(classGrade));
  if (diff === 0) return "exact";
  if (diff === 1) return "adjacent";
  return "none";
}

/**
 * Scores one class against a learner's criteria. Returns `null` when the class
 * fails a hard filter (wrong subject, not browsable, full, or zero topic overlap).
 */
export function scoreClass<T extends ClassForMatching>(
  criteria: MatchCriteria,
  klass: T,
  now: Date = new Date()
): MatchResult<T> | null {
  // ── Hard filters ──
  if (klass.subject !== criteria.subject) return null;
  if (klass.status !== "SCHEDULED" || !klass.published) return null;
  if (klass.enrollmentCount >= klass.maxStudents) return null;
  if (criteria.classFormat === "SOLO" && klass.maxStudents !== 1) return null;
  if (criteria.classFormat === "GROUP" && klass.maxStudents <= 1) return null;

  const upcoming = upcomingScheduledSessions(klass, now);
  if (upcoming.length === 0) return null;

  const matchedTopics = criteria.topics.filter((t) => klass.topics.includes(t));
  if (matchedTopics.length === 0) return null;

  // ── Score ──
  const verifiedMatchedTopics = matchedTopics.filter((t) => klass.verifiedTopics.includes(t));

  const slots = criteria.preferredSlots ?? [];
  const scheduleFitCount =
    slots.length === 0 ? 0 : upcoming.filter((start) => sessionFitsAnySlot(start, slots)).length;

  const gradeMatch = gradeMatchFor(criteria.gradeLevel, klass.gradeLevel);
  const gradeScore =
    gradeMatch === "exact"
      ? WEIGHTS.gradeExact
      : gradeMatch === "adjacent"
        ? WEIGHTS.gradeAdjacent
        : gradeMatch === "any"
          ? WEIGHTS.gradeAny
          : 0;

  const daysUntilNext = (upcoming[0].getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const soonness =
    daysUntilNext >= SOONNESS_HORIZON_DAYS
      ? 0
      : WEIGHTS.soonnessMax * (1 - daysUntilNext / SOONNESS_HORIZON_DAYS);

  const score =
    matchedTopics.length * WEIGHTS.topicMatch +
    verifiedMatchedTopics.length * WEIGHTS.verifiedTopicMatch +
    scheduleFitCount * WEIGHTS.scheduleFit +
    gradeScore +
    soonness;

  return {
    class: klass,
    score: Math.round(score * 100) / 100,
    reasons: { matchedTopics, verifiedMatchedTopics, scheduleFitCount, gradeMatch },
  };
}

/** Scores every class and returns the matches, best first. */
export function rankMatches<T extends ClassForMatching>(
  criteria: MatchCriteria,
  classes: T[],
  now: Date = new Date()
): MatchResult<T>[] {
  return classes
    .map((klass) => scoreClass(criteria, klass, now))
    .filter((r): r is MatchResult<T> => r !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Same score → prefer the class whose next session is sooner.
      const aNext = upcomingScheduledSessions(a.class, now)[0]?.getTime() ?? Infinity;
      const bNext = upcomingScheduledSessions(b.class, now)[0]?.getTime() ?? Infinity;
      return aNext - bNext;
    });
}
