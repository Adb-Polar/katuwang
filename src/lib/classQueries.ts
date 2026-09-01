import { Prisma } from "@prisma/client";

/**
 * Classes a learner may see: every SCHEDULED + published class with at least one
 * upcoming SCHEDULED session, plus any class the learner is already enrolled in.
 * Shared by the class browser (`GET /api/classes`) and the matcher so the two
 * never drift apart.
 */
export function browsableOrEnrolledWhere(learnerId: string): Prisma.TutorClassWhereInput {
  return {
    OR: [
      {
        status: "SCHEDULED",
        published: true,
        sessions: { some: { status: "SCHEDULED", scheduledAt: { gt: new Date() } } },
      },
      { enrollments: { some: { learnerId } } },
    ],
  };
}

/** The "Browse" tab: enrollable classes the learner is NOT already in. */
export function browseClassesWhere(learnerId: string): Prisma.TutorClassWhereInput {
  return {
    status: "SCHEDULED",
    published: true,
    sessions: { some: { status: "SCHEDULED", scheduledAt: { gt: new Date() } } },
    enrollments: { none: { learnerId } },
  };
}

/** The "My Classes" tab: every class the learner is enrolled in, any status. */
export function myClassesWhere(learnerId: string): Prisma.TutorClassWhereInput {
  return { enrollments: { some: { learnerId } } };
}

/** Include shape for a learner-facing class listing (anonymized tutor, own enrollment only). */
export function learnerClassInclude(learnerId: string) {
  return {
    topics: true,
    sessions: { orderBy: { scheduledAt: "asc" as const } },
    tutorProfile: {
      select: {
        id: true,
        user: { select: { id: true, anonymousId: true, firstName: true, lastName: true, section: true } },
        topicCertifications: {
          where: { status: "CERTIFIED" as const },
          select: { subject: true, topic: true },
        },
      },
    },
    _count: { select: { enrollments: true } },
    enrollments: { where: { learnerId }, select: { id: true } },
  } satisfies Prisma.TutorClassInclude;
}

type LearnerClassRow = Prisma.TutorClassGetPayload<{ include: ReturnType<typeof learnerClassInclude> }>;

/**
 * Flattens a class row into the anonymized DTO the learner UI consumes.
 *
 * `showRealNames` mirrors the `showTutorRealNames` platform setting: when true the
 * tutor's real name + section are included alongside the anonymised ID, otherwise
 * only `id` + `anonymousId` are exposed (double-blind default).
 */
export function toLearnerClassDTO(klass: LearnerClassRow, showRealNames = false) {
  const { tutorProfile, topics, ...rest } = klass;
  const { id, anonymousId, firstName, lastName, section } = tutorProfile.user;
  return {
    ...rest,
    topics: topics.map((t) => t.topic),
    verifiedTopics: tutorProfile.topicCertifications
      .filter((cert) => cert.subject === rest.subject)
      .map((cert) => cert.topic),
    tutor: {
      id,
      anonymousId,
      ...(showRealNames ? { name: `${firstName} ${lastName}`.trim(), section } : {}),
    },
  };
}
