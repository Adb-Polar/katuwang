import { MINUTE_MS } from "@/lib/datetime";

/**
 * Slack after the deadline during which a submit still counts — covers the
 * network round-trip of the client's auto-submit when the countdown hits zero.
 */
export const SUBMIT_GRACE_MS = 30_000;

/** Longest time limit an admin or tutor may set on a quiz. */
export const MAX_TIME_LIMIT_MINUTES = 240;

/** When a timed attempt ends, or `null` for an untimed one (no / zero limit). */
export function attemptDeadline(startedAt: Date, timeLimitMinutes: number | null | undefined): Date | null {
  if (!timeLimitMinutes || timeLimitMinutes <= 0) return null;
  return new Date(startedAt.getTime() + timeLimitMinutes * MINUTE_MS);
}

/** True once a submit arrives after the deadline plus the grace window. */
export function isSubmitTooLate(deadline: Date | null, now: Date): boolean {
  return deadline !== null && now.getTime() > deadline.getTime() + SUBMIT_GRACE_MS;
}
