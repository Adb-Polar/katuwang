import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;
export const requestDeadline = (from = new Date()) => new Date(from.getTime() + 72 * 60 * 60 * 1000);
export const activeOpenWhere = (now = new Date()): Prisma.TopicRequestWhereInput => ({ status: "OPEN", expiresAt: { gt: now } });
export const expiredOpenWhere = (now = new Date()): Prisma.TopicRequestWhereInput => ({ status: "OPEN", expiresAt: { lte: now } });

export async function requestSnapshot(tx: Tx, id: string) {
  const request = await tx.topicRequest.findUniqueOrThrow({
    where: { id },
    include: { topics: { select: { topic: true } }, slots: { select: { day: true, startTime: true, endTime: true } } },
  });
  return {
    id: request.id, learnerId: request.learnerId, subject: request.subject,
    gradeLevel: request.gradeLevel, note: request.note, status: request.status,
    fulfilledClassId: request.fulfilledClassId, directedTutorProfileId: request.directedTutorProfileId,
    createdAt: request.createdAt, lastSubmittedAt: request.lastSubmittedAt, expiresAt: request.expiresAt,
    topics: request.topics.map(({ topic }) => topic).sort(),
    slots: request.slots.map(({ day, startTime, endTime }) => ({ day, startTime, endTime }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  };
}

export async function recordRequestHistory(tx: Tx, id: string, actorId: string | null, eventType: string, before: Awaited<ReturnType<typeof requestSnapshot>> | null) {
  const after = await requestSnapshot(tx, id);
  await tx.topicRequestHistory.create({
    data: { requestId: id, actorId, eventType, before: before as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull, after: after as unknown as Prisma.InputJsonValue },
  });
  return after;
}
