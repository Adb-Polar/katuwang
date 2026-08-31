import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClassDetailsView from "@/components/classes/ClassDetailsView";
import SessionsList from "@/components/classes/SessionsList";
import EnrolledLearnersTable from "@/components/classes/EnrolledLearnersTable";
import ClassManageMenu from "@/components/tutor/ClassManageMenu";

export const metadata = {
  title: "Class Details | Katuwang",
};

export default async function TutorClassDetailPage({
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
      enrollments: {
        include: {
          learner: { select: { id: true, anonymousId: true, gradeLevel: true, section: true } },
        },
      },
    },
  });

  if (!tutorClass || tutorClass.tutorProfileId !== tutorProfile.id) notFound();

  const verifiedTopics = tutorProfile.topicCertifications
    .filter((c) => c.subject === tutorClass.subject)
    .map((c) => c.topic);
  const classTopics = tutorClass.topics.map((t) => t.topic);

  return (
    <ClassDetailsView
      backHref="/tutor/classes"
      code={tutorClass.code}
      subject={tutorClass.subject}
      topics={classTopics}
      verifiedTopics={verifiedTopics}
      status={tutorClass.status}
      activeLabel="Active"
      published={tutorClass.published}
      maxStudents={tutorClass.maxStudents}
      enrolledCount={tutorClass.enrollments.length}
      building={tutorClass.building}
      room={tutorClass.room}
      meetingLink={tutorClass.meetingLink}
      description={tutorClass.description}
      sessions={
        <>
          <div className="flex items-center justify-between">
            <h2 className="card-title text-sm font-bold">Sessions</h2>
            <Link href={`/tutor/classes/${tutorClass.id}/edit`} className="btn btn-ghost btn-xs text-xs gap-1">
              <Pencil className="h-3 w-3" />
              Manage in Edit
            </Link>
          </div>
          <SessionsList
            sessions={tutorClass.sessions.map((s) => ({ ...s, scheduledAt: s.scheduledAt.toISOString() }))}
          />
        </>
      }
      roster={
        <EnrolledLearnersTable
          enrollments={tutorClass.enrollments.map((e) => ({ ...e, enrolledAt: e.enrolledAt.toISOString() }))}
          maxStudents={tutorClass.maxStudents}
        />
      }
      actions={
        <ClassManageMenu
          classId={tutorClass.id}
          status={tutorClass.status}
          published={tutorClass.published}
          hasEnrollments={tutorClass.enrollments.length > 0}
        />
      }
    />
  );
}
