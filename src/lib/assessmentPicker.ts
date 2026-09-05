import { Prisma } from "@prisma/client";

/** In-place Fisher–Yates shuffle. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks `count` question ids from a topic's active bank for a new attempt.
 *
 * Best-effort retake variety: questions the tutor saw in their most recent
 * attempt for this (subject, topic) are deprioritised — used only to top up
 * when the fresh pool is too small. The final list order is randomised too.
 *
 * If the active bank holds fewer than `count` questions, returns whatever is
 * available (the caller is expected to have already blocked on `minBankSize`).
 */
export async function pickQuestionIds(
  tx: Prisma.TransactionClient,
  {
    tutorProfileId,
    subject,
    topic,
    count,
  }: { tutorProfileId: string; subject: string; topic: string; count: number }
): Promise<string[]> {
  const pool = await tx.assessmentQuestion.findMany({
    // origin: "BANK" — certification quizzes never serve tutor-authored questions.
    where: { subject, topic, active: true, origin: "BANK" },
    select: { id: true },
  });
  const poolIds = pool.map((q) => q.id);
  if (poolIds.length <= count) return shuffle(poolIds);

  const lastAttempt = await tx.assessmentAttempt.findFirst({
    where: { tutorProfileId, subject, topic, submittedAt: { not: null } },
    orderBy: { attemptNo: "desc" },
    select: { items: { select: { questionId: true } } },
  });
  const seen = new Set(lastAttempt?.items.map((i) => i.questionId) ?? []);

  const fresh = shuffle(poolIds.filter((id) => !seen.has(id)));
  const repeat = shuffle(poolIds.filter((id) => seen.has(id)));

  const chosen = [...fresh, ...repeat].slice(0, count);
  return shuffle(chosen);
}
