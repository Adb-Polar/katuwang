import { Prisma } from "@prisma/client";
export class QuestionWriteError extends Error {
  constructor(message: string, readonly status = 409) { super(message); }
}
export async function lockQuestionRows(tx: Prisma.TransactionClient, ids: string[]) {
  const sorted = [...new Set(ids)].sort();
  if (!sorted.length) return;
  await tx.$queryRaw(Prisma.sql`SELECT id FROM assessment_questions WHERE id IN (${Prisma.join(sorted)}) ORDER BY id FOR UPDATE`);
}
export async function lockSessionTestRow(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM session_tests WHERE id = ${id} FOR UPDATE`;
}
export async function lockActiveQuestions(tx: Prisma.TransactionClient, ids: string[]) {
  await lockQuestionRows(tx, ids);
  const active = await tx.assessmentQuestion.findMany({ where: { id: { in: ids }, active: true }, select: { id: true } });
  if (active.length !== ids.length) throw new QuestionWriteError("A selected question was retired or removed. Refresh the question set and try again.");
  await tx.assessmentQuestion.updateMany({ where: { id: { in: ids }, lockedAt: null }, data: { lockedAt: new Date() } });
}
export function isQuestionContentLocked(question: {
  lockedAt?: Date | null;
  _count: { attemptItems?: number; sessionTestItems?: number; nextVersions?: number };
  sessionTestLinks?: { sessionTest: { status: string; publishedAt?: Date | null } }[];
}) {
  return Boolean(question.lockedAt || question._count.attemptItems || question._count.sessionTestItems || question._count.nextVersions || question.sessionTestLinks?.some(link => link.sessionTest.status !== "DRAFT" || link.sessionTest.publishedAt));
}
