import { getActiveServerSession } from "@/lib/serverSession";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClassDetailsView from "@/components/classes/ClassDetailsView";
import { nextSessionAt } from "@/components/classes/classStatus";
import SessionsList from "@/components/classes/SessionsList";
import EnrolledLearnersTable from "@/components/classes/EnrolledLearnersTable";
import ClassManageMenu from "@/components/tutor/ClassManageMenu";
import ClassAppealCard from "@/components/tutor/ClassAppealCard";
import SessionTestsCard from "@/components/classes/SessionTestsCard";
import ClassProgressPanel from "@/components/tutor/ClassProgressPanel";
import SessionActions from "@/components/tutor/SessionActions";

export const metadata = {
  title: "Class Details | Katuwang",
};

export default async function TutorClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

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
        include: { test: { select: { id: true, title: true, status: true, pretestClosedAt: true, posttestOpenedAt: true } } },
      },
      enrollments: {
        where: { withdrawnAt: null },
        include: {
          learner: { select: { id: true, anonymousId: true, image: true, gradeLevel: true, section: true } },
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
      audience="tutor"
      backHref="/tutor/classes"
      backLabel="Back to my classes"
      code={tutorClass.code}
      subject={tutorClass.subject}
      gradeLevel={tutorClass.gradeLevel}
      topics={classTopics}
      verifiedTopics={verifiedTopics}
      status={tutorClass.status}
      published={tutorClass.published}
      suspendedReason={tutorClass.suspendedReason}
      suspendedUntil={tutorClass.suspendedUntil?.toISOString() ?? null}
      moderationExtra={locked ? <ClassAppealCard classId={tutorClass.id} appeal={latestAppeal} /> : undefined}
      maxStudents={tutorClass.maxStudents}
      enrolledCount={tutorClass.enrollments.length}
      nextSessionAt={nextSessionAt(tutorClass.sessions)}
      building={tutorClass.building}
      room={tutorClass.room}
      meetingLink={tutorClass.meetingLink}
      description={tutorClass.description}
      sessions={
        <>
          <h2 className="font-serif text-xl font-medium">Sessions</h2>
          <SessionsList
            variant="calendar"
            sessions={tutorClass.sessions.map((s) => ({
              id: s.id,
              topic: s.topic,
              scheduledAt: s.scheduledAt.toISOString(),
              duration: s.duration,
              status: s.status,
            }))}
            renderActions={locked ? undefined : (s) => <SessionActions classId={tutorClass.id} session={s} classTopics={classTopics} />}
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
        <>
          <ClassProgressPanel classId={tutorClass.id} />
          <SessionTestsCard
            classId={tutorClass.id}
            audience="tutor"
            rows={tutorClass.sessions.map((s) => ({
              sessionId: s.id,
              topic: s.topic,
              scheduledAt: s.scheduledAt.toISOString(),
              sessionStatus: s.status,
              test: s.test ? { id: s.test.id, title: s.test.title, status: s.test.status, pretestClosedAt: s.test.pretestClosedAt?.toISOString() ?? null, posttestOpenedAt: s.test.posttestOpenedAt?.toISOString() ?? null } : null,
            }))}
            tutorActionsEnabled={!locked}
          />
        </>
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
