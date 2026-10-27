import { getActiveServerSession } from "@/lib/serverSession";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Users, EyeOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { getSetting } from "@/lib/settings";
import { isStudentEligibleForClass } from "@/lib/gradeLevels";
import ClassDetailsView from "@/components/classes/ClassDetailsView";
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

  const [tutorClass, showRealNames, learner] = await Promise.all([
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
              select: { id: true, anonymousId: true, image: true, firstName: true, lastName: true, section: true, gradeLevel: true },
            },
            topicCertifications: {
              where: { status: "CERTIFIED" },
              select: { subject: true, topic: true },
            },
          },
        },
        _count: { select: { enrollments: true } },
        enrollments: { where: { learnerId: session!.user.id }, select: { id: true } },
      },
    }),
    getSetting("showTutorRealNames"),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { gradeLevel: true },
    }),
  ]);

  if (!tutorClass) notFound();

  const isEnrolled = tutorClass.enrollments.length > 0;
  const isEligible = isStudentEligibleForClass(
    learner?.gradeLevel,
    tutorClass.tutorProfile.user.gradeLevel,
    tutorClass.gradeLevel
  );
  const isBrowsable =
    tutorClass.status === "SCHEDULED" &&
    tutorClass.published &&
    isEligible &&
    tutorClass.sessions.some((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > new Date());

  if (!isEnrolled && !isBrowsable) notFound();

  // The tutor has unpublished this class. Enrolled learners keep their spot,
  // but the details stay hidden until it's published again.
  if (isEnrolled && !tutorClass.published) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-warning/10 text-warning">
          <EyeOff className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-base-content">This class isn&apos;t published yet</h1>
        <p className="text-sm text-base-content/60">
          You&apos;re still enrolled. Your tutor has temporarily hidden the class details —
          check back once it&apos;s published again.
        </p>
        <Link href="/learner/my-classes" className="btn btn-neutral btn-sm">
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
      backHref={backHref}
      code={tutorClass.code}
      subject={tutorClass.subject}
      topics={tutorClass.topics.map((t) => t.topic)}
      verifiedTopics={verifiedTopics}
      status={tutorClass.status}
      activeLabel="Open"
      published={tutorClass.published}
      suspendedReason={tutorClass.suspendedReason}
      suspendedUntil={tutorClass.suspendedUntil?.toISOString() ?? null}
      moderationAudience="learner"
      maxStudents={tutorClass.maxStudents}
      enrolledCount={tutorClass._count.enrollments}
      building={tutorClass.building}
      room={tutorClass.room}
      meetingLink={tutorClass.meetingLink}
      description={tutorClass.description}
      extraFacts={
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="font-semibold text-2xs text-base-content/50">TUTOR</div>
            <TutorInfoTrigger
              tutorId={tutorUser.id}
              anonymousId={tutorUser.anonymousId}
              name={showRealNames ? `${tutorUser.firstName} ${tutorUser.lastName}`.trim() : null}
              section={showRealNames ? tutorUser.section : null}
              image={tutorUser.image}
            />
          </div>
        </div>
      }
      sessions={
        <>
          <h2 className="card-title text-sm font-bold">Sessions</h2>
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
      belowRoster={
        isEnrolled ? (
          <div className="space-y-6">
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
                  test: test ? { id: test.id, title: test.title, status: test.status } : null,
                  pre: attemptOf("PRE"),
                  post: attemptOf("POST"),
                };
              })}
            />
            <MyProgressView fixedClassId={tutorClass.id} compact />
          </div>
        ) : undefined
      }
      actions={
        <LearnerClassActions
          classId={tutorClass.id}
          status={tutorClass.status}
          isEnrolled={isEnrolled}
          isFull={tutorClass._count.enrollments >= tutorClass.maxStudents}
          reportLabel={`${subjectDisplayLabel(tutorClass.subject)} · ${tutorClass.code}`}
        />
      }
    />
  );
}
