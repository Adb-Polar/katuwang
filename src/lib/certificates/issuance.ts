import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { subjectDisplayLabel } from "@/lib/displayLabels";

/** Called in the same locked transaction as the tutor's explicit class completion. */
export async function issueClassCertificates(tx: Prisma.TransactionClient, classId: string) {
  const cls = await tx.tutorClass.findUnique({
    where: { id: classId },
    include: {
      sessions: { select: { status: true } },
      tutorProfile: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      enrollments: { where: { withdrawnAt: null, learner: { role: "STUDENT_LEARNER" } }, include: { learner: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });
  // Legacy COMPLETED rows without a confirmed completion timestamp are not backfilled.
  if (!cls || cls.status !== "COMPLETED" || !cls.completedAt || !cls.sessions.some(s => s.status === "COMPLETED") || cls.sessions.some(s => s.status === "SCHEDULED")) return;
  const subject = await tx.subject.findUnique({ where: { slug: cls.subject }, select: { name: true } });
  const tutor = cls.tutorProfile.user;
  if (!cls.enrollments.length) return;
  await tx.completionCertificate.createMany({
    data: cls.enrollments.map(({ learner }) => ({
      certificateNumber: `KTW-${randomUUID().replaceAll("-", "").toUpperCase()}`,
      learnerId: learner.id, tutorId: tutor.id, classId,
      learnerName: `${learner.firstName} ${learner.lastName}`.trim(),
      tutorName: `${tutor.firstName} ${tutor.lastName}`.trim(),
      subjectName: subject?.name ?? subjectDisplayLabel(cls.subject),
      classCode: cls.code, completedAt: cls.completedAt!,
    })),
    skipDuplicates: true,
  });
}
