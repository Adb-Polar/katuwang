import { getActiveServerSession } from "@/lib/serverSession";
import { notFound, redirect } from "next/navigation";
import { hasClassStarted } from "@/lib/classQueries";
import Link from "next/link";
import { EyeOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { getSetting } from "@/lib/settings";
import ClassDetailsView from "@/components/classes/ClassDetailsView";
import { nextSessionAt } from "@/components/classes/classStatus";
import SessionsList from "@/components/classes/SessionsList";
import LearnerClassActions from "@/components/learner/LearnerClassActions";
import TutorInfoTrigger from "@/components/learner/TutorInfoTrigger";
import SessionTestsCard from "@/components/classes/SessionTestsCard";
import MyProgressView from "@/components/learner/MyProgressView";
import { subjectDisplayLabel } from "@/lib/displayLabels";

export const metadata = {
  title: "Class Details | Katuwang",
};

export default async function LearnerClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { classId } = await params;
  const { from } = await searchParams;
  // Return the in-page "Back" link to whichever list the learner came from.
  const backHref = from === "my-classes" ? "/learner/my-classes" : "/learner/classes";
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  await reinstateExpiredClasses();

  const [tutorClass, showRealNames] = await Promise.all([
    prisma.tutorClass.findUnique({
      where: { id: classId },
      include: {
        topics: true,
        sessions: {
          orderBy: { scheduledAt: "asc" },
          include: {
            test: {
              select: {
                id: true,
                title: true,
                status: true,
                pretestClosedAt: true,
                posttestOpenedAt: true,
                attempts: {
                  where: { learnerId: session!.user.id },
                  select: { kind: true, status: true, scorePercent: true },
                },
              },
            },
          },
        },
        tutorProfile: {
          select: {
            user: {
              select: { id: true, anonymousId: true, firstName: true, lastName: true, section: true },
            },
            topicCertifications: {
              where: { status: "CERTIFIED" },
              select: { subject: true, topic: true },
            },
          },
        },
        _count: { select: { enrollments: { where: { withdrawnAt: null } } } },
        enrollments: { where: { learnerId: session!.user.id }, select: { id: true, withdrawnAt: true } },
      },
    }),
    getSetting("showTutorRealNames"),
  ]);

  if (!tutorClass) notFound();

  const isEnrolled = tutorClass.enrollments.some(enrollment => !enrollment.withdrawnAt);
  const isBrowsable =
    tutorClass.status === "SCHEDULED" &&
    tutorClass.published &&
    !hasClassStarted(tutorClass.sessions) &&
    tutorClass.sessions.some((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > new Date());

  if (!isEnrolled && !isBrowsable) notFound();

  // The tutor has unpublished this class. Enrolled learners keep their spot,
  // but the details stay hidden until it's published again.
  if (isEnrolled && !tutorClass.published) {
    return (
      <div className="max-w-lg py-12 space-y-4">
        <EyeOff aria-hidden="true" className="h-6 w-6 text-(--kt-muted)" />
        <h1 className="font-serif text-3xl font-medium">This class is hidden for now</h1>
        <p className="text-(--kt-muted)">
          You&apos;re still enrolled. Your tutor has hidden the class details for the moment;
          they&apos;ll be back here once it&apos;s published again.
        </p>
        <Link href="/learner/my-classes" className="btn btn-primary">
          Back to my classes
        </Link>
      </div>
    );
  }

  const verifiedTopics = tutorClass.tutorProfile.topicCertifications
    .filter((c) => c.subject === tutorClass.subject)
    .map((c) => c.topic);

  const tutorUser = tutorClass.tutorProfile.user;

  return (
    <ClassDetailsView
      audience="learner"
      backHref={backHref}
      backLabel={from === "my-classes" ? "Back to my classes" : "Back to browse classes"}
      code={tutorClass.code}
      subject={tutorClass.subject}
      gradeLevel={tutorClass.gradeLevel}
      topics={tutorClass.topics.map((t) => t.topic)}
      verifiedTopics={verifiedTopics}
      status={tutorClass.status}
      published={tutorClass.published}
      suspendedReason={tutorClass.suspendedReason}
      suspendedUntil={tutorClass.suspendedUntil?.toISOString() ?? null}
      maxStudents={tutorClass.maxStudents}
      enrolledCount={tutorClass._count.enrollments}
      nextSessionAt={nextSessionAt(tutorClass.sessions)}
      building={tutorClass.building}
      room={tutorClass.room}
      meetingLink={tutorClass.meetingLink}
      description={tutorClass.description}
      tutor={
        <TutorInfoTrigger
          tutorId={tutorUser.id}
          anonymousId={tutorUser.anonymousId}
          name={showRealNames ? `${tutorUser.firstName} ${tutorUser.lastName}`.trim() : null}
          section={showRealNames ? tutorUser.section : null}
        />
      }
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
          />
        </>
      }
      belowRoster={
        isEnrolled ? (
          <>
            <SessionTestsCard
              classId={tutorClass.id}
              audience="learner"
              rows={tutorClass.sessions.map((s) => {
                const test = s.test && s.test.status !== "DRAFT" ? s.test : null;
                const attemptOf = (kind: "PRE" | "POST") => test?.attempts.find((a) => a.kind === kind) ?? null;
                return {
                  sessionId: s.id,
                  topic: s.topic,
                  scheduledAt: s.scheduledAt.toISOString(),
                  sessionStatus: s.status,
                  test: test ? { id: test.id, title: test.title, status: test.status, pretestClosedAt: test.pretestClosedAt?.toISOString() ?? null, posttestOpenedAt: test.posttestOpenedAt?.toISOString() ?? null } : null,
                  pre: attemptOf("PRE"),
                  post: attemptOf("POST"),
                };
              })}
            />
            <MyProgressView fixedClassId={tutorClass.id} compact />
          </>
        ) : undefined
      }
      actions={
        <LearnerClassActions
          classId={tutorClass.id}
          status={tutorClass.status}
          isEnrolled={isEnrolled}
          canReport={tutorClass.enrollments.length > 0}
          isFull={tutorClass._count.enrollments >= tutorClass.maxStudents}
          reportLabel={`${subjectDisplayLabel(tutorClass.subject)} · ${tutorClass.code}`}
        />
      }
    />
  );
}
