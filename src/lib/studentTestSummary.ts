/** One submitted session-test attempt, as the tutor's student page loads it. */
export interface StudentAttempt {
  kind: "PRE" | "POST";
  scorePercent: number;
  sessionTest: {
    session: { id: string; topic: string; scheduledAt: Date; class: { id: string; code: string } };
  };
}

export interface StudentSessionResult {
  sessionId: string;
  classId: string;
  classCode: string;
  topic: string;
  scheduledAt: Date;
  pre: number | null;
  post: number | null;
}

/** Pairs a learner's pre- and post-test scores per session, newest session first. */
export function studentSessionResults(attempts: StudentAttempt[]): StudentSessionResult[] {
  const bySession = new Map<string, StudentSessionResult>();
  for (const attempt of attempts) {
    const { session } = attempt.sessionTest;
    const row = bySession.get(session.id) ?? {
      sessionId: session.id,
      classId: session.class.id,
      classCode: session.class.code,
      topic: session.topic,
      scheduledAt: session.scheduledAt,
      pre: null,
      post: null,
    };
    if (attempt.kind === "PRE") row.pre = attempt.scorePercent;
    else row.post = attempt.scorePercent;
    bySession.set(session.id, row);
  }
  return [...bySession.values()].sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
}

/** Average post-minus-pre change in percentage points over sessions with both scores; null when there are none. */
export function averageGain(results: StudentSessionResult[]): number | null {
  const paired = results.filter((r) => r.pre !== null && r.post !== null);
  if (paired.length === 0) return null;
  return Math.round(paired.reduce((sum, r) => sum + (r.post! - r.pre!), 0) / paired.length);
}
