import type { Prisma, PrismaClient } from "@prisma/client";

// The subset of the Prisma client (or an in-transaction `tx`) these helpers need.
type NotifyClient = Pick<PrismaClient, "notification"> | Prisma.TransactionClient;

export type NotificationType =
  // topic requests
  | "TOPIC_REQUEST_DIRECTED"
  | "TOPIC_REQUEST_ACCEPTED"
  | "TOPIC_REQUEST_REOPENED"
  | "TOPIC_REQUEST_FULFILLED"
  // registration moderation ("REGISTRATION_REJECTED" is reserved but not delivered —
  // a declined applicant is BANNED in the same transaction and can never sign in)
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_REJECTED"
  // topic certification review
  | "CERTIFICATION_CERTIFIED"
  | "CERTIFICATION_REJECTED"
  // question-bank requests
  | "QUESTION_REQUEST_NEW"
  | "QUESTION_REQUEST_RESOLVED"
  | "QUESTION_REQUEST_DISMISSED"
  // class enrolment (tutor-facing)
  | "CLASS_ENROLLMENT_NEW"
  | "CLASS_ENROLLMENT_DROPPED"
  // class lifecycle (learner-facing)
  | "CLASS_CANCELLED"
  | "CLASS_COMPLETED"
  // class appeals — filed (admin-facing), reviewed (tutor-facing)
  | "CLASS_APPEAL_NEW"
  | "CLASS_APPEAL_APPROVED"
  | "CLASS_APPEAL_REJECTED"
  // session pre/post tests (learner-facing)
  | "SESSION_PRETEST_OPEN"
  | "SESSION_POSTTEST_OPEN";

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
