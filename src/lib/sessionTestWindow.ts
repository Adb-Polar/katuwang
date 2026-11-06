import type { SessionStatus, SessionTestAttemptStatus, SessionTestKind, SessionTestStatus } from "@prisma/client";
import { MINUTE_MS } from "@/lib/datetime";

export const ATTEMPT_CLOSE_GRACE_MS = 15 * MINUTE_MS;

/** Ordinary closure permits only attempts started before closure, for 15 minutes. */
export function attemptWindowError(
  attempt: { kind: SessionTestKind; status: SessionTestAttemptStatus; startedAt: Date },
  test: { status: SessionTestStatus; closedAt: Date | null; pretestClosedAt: Date | null },
  sessionStatus: SessionStatus,
  now = new Date(),
): string | null {
  if (test.status === "DRAFT") return "This test is not available.";
  if (attempt.status === "SUBMITTED") return null;
  if (sessionStatus === "CANCELLED") return "This session was cancelled.";
  const closures = [test.status === "CLOSED" ? test.closedAt : null,
    attempt.kind === "PRE" ? test.pretestClosedAt : null].filter((date): date is Date => Boolean(date));
  if ((test.status === "CLOSED" && !test.closedAt) ||
      (attempt.kind === "PRE" && sessionStatus === "COMPLETED" && !test.pretestClosedAt)) {
    return "This test window has closed.";
  }
  if (closures.some((closed) => attempt.startedAt > closed || now.getTime() > closed.getTime() + ATTEMPT_CLOSE_GRACE_MS)) {
    return "The 15-minute period for finishing this test has ended.";
  }
  return null;
}
