import { MINUTE_MS } from "@/lib/datetime";

export const MIN_TIME_LIMIT_MINUTES = 1;
export const MAX_TIME_LIMIT_MINUTES = 180;
/** A submit that arrives this long after the deadline still counts as on time (auto-submit + network delay). */
export const SUBMIT_GRACE_MS = 30_000;

interface TimedAttempt {
  startedAt: Date;
  /** Snapshot taken when the attempt started; null = untimed. */
  timeLimitMinutes: number | null;
  submittedAt?: Date | null;
}

/** When the attempt's time runs out; null for an untimed attempt. */
export function attemptDeadline({ startedAt, timeLimitMinutes }: TimedAttempt): Date | null {
  return timeLimitMinutes ? new Date(startedAt.getTime() + timeLimitMinutes * MINUTE_MS) : null;
}

/**
 * Whether a timed attempt was handed in after its deadline plus the grace period.
 * A late attempt is still graded — the flag tells the tutor or admin reading the result.
 */
export function wasSubmittedLate(attempt: TimedAttempt): boolean {
  const deadline = attemptDeadline(attempt);
  return Boolean(deadline && attempt.submittedAt && attempt.submittedAt.getTime() > deadline.getTime() + SUBMIT_GRACE_MS);
}

/** "4:05" for a countdown; never negative. */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}
