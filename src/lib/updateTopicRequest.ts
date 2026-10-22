import { Prisma } from "@prisma/client";
import { requestDeadline, requestSnapshot, recordRequestHistory } from "@/lib/topicRequestHistory";

export async function updateTopicRequest(tx: Prisma.TransactionClient, id: string, data: Prisma.TopicRequestUpdateInput, actorId: string | null, eventType = "STATUS_CHANGED") {
  const before = await requestSnapshot(tx, id);
  const now = new Date();
  const updated = await tx.topicRequest.update({
    where: { id },
    data: { ...data, ...(data.status === "OPEN" && before.status !== "OPEN" ? { lastSubmittedAt: now, expiresAt: requestDeadline(now) } : {}) },
  });
  await recordRequestHistory(tx, id, actorId, eventType, before);
  return updated;
}
