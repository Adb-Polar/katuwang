import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Qualification keys are teaching material only after certification in that exact topic. */
export async function certifiedBankTopics(userId: string): Promise<{ subject: string; topic: string }[]> {
  return prisma.topicCertification.findMany({
    where: { tutorProfile: { userId }, status: "CERTIFIED" },
    select: { subject: true, topic: true },
  });
}

export function certifiedBankWhere(topics: { subject: string; topic: string }[]): Prisma.AssessmentQuestionWhereInput {
  // An empty OR matches nothing in Prisma; never omit it and widen the pool.
  return { OR: topics.map(({ subject, topic }) => ({ subject, topic })) };
}
