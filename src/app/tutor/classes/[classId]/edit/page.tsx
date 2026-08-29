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
      sessions: { select: { topic: true } },
      enrollments: { select: { id: true } },
    },
  });

  if (!tutorClass || tutorClass.tutorProfileId !== tutorProfile.id) notFound();

  if (tutorClass.status === "SUSPENDED" || tutorClass.status === "BANNED") {
    return (
      <div className="space-y-6">
        <div className="alert alert-warning text-xs">
          <span>This class was suspended or banned by an administrator and can&apos;t be modified.</span>
        </div>
      </div>
    );
  }

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
    />
  );
}
