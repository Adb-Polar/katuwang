import type { SessionTestAttempt } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Feedback unlocks only after this learner submits this test's POST attempt. */
export async function canRevealLearnerSessionAnswers(
  attempt: Pick<SessionTestAttempt, "learnerId" | "sessionTestId" | "kind" | "status">,
): Promise<boolean> {
  if (attempt.status !== "SUBMITTED") return false;
  if (attempt.kind === "POST") return true;
  if (attempt.kind !== "PRE") return false;
  const post = await prisma.sessionTestAttempt.findFirst({
    where: { learnerId: attempt.learnerId, sessionTestId: attempt.sessionTestId, kind: "POST", status: "SUBMITTED" },
    select: { id: true },
  });
  return Boolean(post);
}
