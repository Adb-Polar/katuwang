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
import ClassAppealCard from "@/components/tutor/ClassAppealCard";
import SessionTestsCard from "@/components/classes/SessionTestsCard";
import ClassProgressPanel from "@/components/tutor/ClassProgressPanel";

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
      sessions: {
        orderBy: { scheduledAt: "asc" },
        include: { test: { select: { id: true, title: true, status: true } } },
      },
      enrollments: {
        include: {
          learner: { select: { id: true, anonymousId: true, gradeLevel: true, section: true } },
        },
      },
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
      suspendedReason={tutorClass.suspendedReason}
      suspendedUntil={tutorClass.suspendedUntil?.toISOString() ?? null}
      moderationExtra={locked ? <ClassAppealCard classId={tutorClass.id} appeal={latestAppeal} /> : undefined}
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
            {!locked && (
              <Link href={`/tutor/classes/${tutorClass.id}/edit`} className="btn btn-ghost btn-xs text-xs gap-1">
                <Pencil className="h-3 w-3" />
                Manage in Edit
              </Link>
            )}
          </div>
          <SessionsList
            sessions={tutorClass.sessions.map((s) => ({
              id: s.id,
              topic: s.topic,
              scheduledAt: s.scheduledAt.toISOString(),
              duration: s.duration,
              status: s.status,
            }))}
          />
        </>
      }
      roster={
        <EnrolledLearnersTable
          enrollments={tutorClass.enrollments.map((e) => ({ ...e, enrolledAt: e.enrolledAt.toISOString() }))}
          maxStudents={tutorClass.maxStudents}
        />
      }
      belowRoster={
        <div className="space-y-6">
          <ClassProgressPanel classId={tutorClass.id} />
          <SessionTestsCard
            classId={tutorClass.id}
            audience="tutor"
            rows={tutorClass.sessions.map((s) => ({
              sessionId: s.id,
              topic: s.topic,
              scheduledAt: s.scheduledAt.toISOString(),
              test: s.test ? { id: s.test.id, title: s.test.title, status: s.test.status } : null,
            }))}
          />
        </div>
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
