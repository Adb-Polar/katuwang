import type { Prisma, PrismaClient } from "@prisma/client";

// The subset of the Prisma client (or an in-transaction `tx`) these helpers need.
type NotifyClient = Pick<PrismaClient, "notification"> | Prisma.TransactionClient;

export type NotificationType =
  | "TOPIC_REQUEST_DIRECTED"
  | "TOPIC_REQUEST_ACCEPTED"
  | "TOPIC_REQUEST_REOPENED"
  | "TOPIC_REQUEST_FULFILLED";

/** Creates one notification for a single user. Meant to be called inside a `$transaction`. */
export async function notify(
  tx: NotifyClient,
  userId: string,
  type: NotificationType,
  message: string,
  link?: string | null
) {
  return tx.notification.create({
    data: { userId, type, message, link: link ?? null },
  });
}

/** Creates the same notification for several users at once. */
export async function notifyMany(
  tx: NotifyClient,
  userIds: string[],
  type: NotificationType,
  message: string,
  link?: string | null
) {
  if (userIds.length === 0) return { count: 0 };
  return tx.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, message, link: link ?? null })),
  });
}
