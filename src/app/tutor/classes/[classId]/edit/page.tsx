import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditClassForm from "@/components/tutor/EditClassForm";

export const metadata = {
  title: "Edit Class | Katuwang",
};

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, topicCertifications: { where: { status: "CERTIFIED" }, select: { subject: true, topic: true } } },
  });

  if (!tutorProfile) notFound();

  const tutorClass = await prisma.tutorClass.findUnique({
    where: { id: classId },
    include: {
      topics: true,
      sessions: { orderBy: { scheduledAt: "asc" } },
      enrollments: { select: { id: true } },
      appeals: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!tutorClass || tutorClass.tutorProfileId !== tutorProfile.id) notFound();

  const latestAppeal = tutorClass.appeals[0]
    ? {
        id: tutorClass.appeals[0].id,
        status: tutorClass.appeals[0].status,
        reason: tutorClass.appeals[0].reason,
        reviewNote: tutorClass.appeals[0].reviewNote,
        createdAt: tutorClass.appeals[0].createdAt.toISOString(),
        reviewedAt: tutorClass.appeals[0].reviewedAt?.toISOString() ?? null,
      }
    : null;

  const locked = tutorClass.status === "SUSPENDED" || tutorClass.status === "BANNED";

  const verifiedTopics = tutorProfile.topicCertifications
    .filter((c) => c.subject === tutorClass.subject)
    .map((c) => c.topic);

  return (
    <EditClassForm
      classId={tutorClass.id}
      subject={tutorClass.subject}
      gradeLevel={tutorClass.gradeLevel}
      status={tutorClass.status}
      activeLabel="Active"
      published={tutorClass.published}
      currentTopics={tutorClass.topics.map((t) => t.topic)}
      verifiedTopics={verifiedTopics}
      usedTopics={Array.from(new Set(tutorClass.sessions.map((s) => s.topic)))}
      description={tutorClass.description}
      maxStudents={tutorClass.maxStudents}
      enrolledCount={tutorClass.enrollments.length}
      building={tutorClass.building}
      room={tutorClass.room}
      meetingLink={tutorClass.meetingLink}
      classTopics={tutorClass.topics.map((t) => t.topic)}
      sessions={tutorClass.sessions.map((s) => ({
        id: s.id,
        topic: s.topic,
        scheduledAt: s.scheduledAt.toISOString(),
        duration: s.duration,
        status: s.status,
      }))}
      locked={locked}
      suspendedReason={tutorClass.suspendedReason}
      suspendedUntil={tutorClass.suspendedUntil?.toISOString() ?? null}
      appeal={latestAppeal}
    />
  );
}
