import { Prisma } from "@prisma/client";

/**
 * The Prisma `where` for the set of OPEN topic requests a given tutor can act on
 * (the tutor's "Open to me" pool): every request directed specifically at this
 * tutor, plus every public request (no directed tutor) in a subject the tutor
 * holds at least one CERTIFIED certification for, restricted to that tutor's
 * certified topics.
 *
 * Reused by `GET /api/tutor/topic-requests?tab=open` and the accept route's
 * eligibility check.
 */
export function tutorPoolWhere(
  tutorProfileId: string,
  certifiedTopics: { subject: string; topic: string }[]
): Prisma.TopicRequestWhereInput {
  const topicsBySubject = new Map<string, string[]>();
  for (const c of certifiedTopics) {
    topicsBySubject.set(c.subject, [...(topicsBySubject.get(c.subject) ?? []), c.topic]);
  }

  const publicEligible: Prisma.TopicRequestWhereInput[] = [...topicsBySubject.entries()].map(
    ([subject, topics]) => ({
      subject,
      topics: { some: { topic: { in: topics } } },
    })
  );

  return {
    status: "OPEN",
    OR: [
      { directedTutorProfileId: tutorProfileId },
      { directedTutorProfileId: null, OR: publicEligible.length > 0 ? publicEligible : [{ id: "__none__" }] },
    ],
  };
}
