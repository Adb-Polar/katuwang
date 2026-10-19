import { Prisma, GradeLevel } from "@prisma/client";
import {
  getEligibleTutorGradesForStudent,
  getEligibleClassTargetGradesForStudent,
} from "@/lib/gradeLevels";

/**
 * Prisma where condition enforcing:
 * 1. Tutor grade >= student grade (studentGrade <= tutorGrade)
 * 2. Class target grade is null (open) OR target grade >= student grade (studentGrade <= targetGrade)
 */
export function gradeEligibilityWhere(
  studentGrade: GradeLevel | string
): Prisma.TutorClassWhereInput {
  const eligibleTutorGrades = getEligibleTutorGradesForStudent(studentGrade);
  const eligibleTargetGrades = getEligibleClassTargetGradesForStudent(studentGrade);
  return {
    tutorProfile: { user: { gradeLevel: { in: eligibleTutorGrades } } },
    OR: [
      { gradeLevel: null },
      { gradeLevel: { in: eligibleTargetGrades } },
    ],
  };
}

/**
 * Classes a learner may see: every SCHEDULED + published class with at least one
 * upcoming SCHEDULED session, plus any class the learner is already enrolled in.
 * Shared by the class browser (`GET /api/classes`) and the matcher so the two
 * never drift apart.
 */
export function browsableOrEnrolledWhere(
  learnerId: string,
  learnerGrade?: GradeLevel | string | null
): Prisma.TutorClassWhereInput {
  const schedWhere: Prisma.TutorClassWhereInput = {
    status: "SCHEDULED",
    published: true,
    sessions: { some: { status: "SCHEDULED", scheduledAt: { gt: new Date() } } },
    ...(learnerGrade ? gradeEligibilityWhere(learnerGrade) : {}),
  };

  return {
    OR: [
      schedWhere,
      { enrollments: { some: { learnerId } } },
    ],
  };
}

/** The "Browse" tab: enrollable classes the learner is NOT already in. */
export function browseClassesWhere(
  learnerId: string,
  learnerGrade?: GradeLevel | string | null
): Prisma.TutorClassWhereInput {
  const base: Prisma.TutorClassWhereInput = {
    status: "SCHEDULED",
    published: true,
    sessions: { some: { status: "SCHEDULED", scheduledAt: { gt: new Date() } } },
    enrollments: { none: { learnerId } },
  };

  if (!learnerGrade) return base;

  const gradeFilter = gradeEligibilityWhere(learnerGrade);
  return {
    ...base,
    tutorProfile: gradeFilter.tutorProfile,
    OR: gradeFilter.OR,
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
        user: { select: { id: true, anonymousId: true, image: true, firstName: true, lastName: true, section: true } },
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
  const { id, anonymousId, image, firstName, lastName, section } = tutorProfile.user;
  return {
    ...rest,
    topics: topics.map((t) => t.topic),
    verifiedTopics: tutorProfile.topicCertifications
      .filter((cert) => cert.subject === rest.subject)
      .map((cert) => cert.topic),
    tutor: {
      id,
      anonymousId,
      image,
      ...(showRealNames ? { name: `${firstName} ${lastName}`.trim(), section } : {}),
    },
  };
}
