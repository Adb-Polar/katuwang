import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
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
    },
  });

  if (!tutorClass || tutorClass.tutorProfileId !== tutorProfile.id) notFound();

  // A finished class is read-only — there's nothing left to schedule or change.
  if (tutorClass.status === "COMPLETED") redirect(`/tutor/classes/${classId}`);

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
    />
  );
}
