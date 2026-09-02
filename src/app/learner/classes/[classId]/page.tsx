import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { getSetting } from "@/lib/settings";
import ClassDetailsView from "@/components/classes/ClassDetailsView";
import SessionsList from "@/components/classes/SessionsList";
import LearnerClassActions from "@/components/learner/LearnerClassActions";
import TutorInfoTrigger from "@/components/learner/TutorInfoTrigger";

export const metadata = {
  title: "Class Details | Katuwang",
};

export default async function LearnerClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);

  await reinstateExpiredClasses();

  const [tutorClass, showRealNames] = await Promise.all([
    prisma.tutorClass.findUnique({
      where: { id: classId },
      include: {
        topics: true,
        sessions: { orderBy: { scheduledAt: "asc" } },
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
        _count: { select: { enrollments: true } },
        enrollments: { where: { learnerId: session!.user.id }, select: { id: true } },
      },
    }),
    getSetting("showTutorRealNames"),
  ]);

  if (!tutorClass) notFound();

  const isEnrolled = tutorClass.enrollments.length > 0;
  const isBrowsable =
    tutorClass.status === "SCHEDULED" &&
    tutorClass.published &&
    tutorClass.sessions.some((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > new Date());

  if (!isEnrolled && !isBrowsable) notFound();

  const verifiedTopics = tutorClass.tutorProfile.topicCertifications
    .filter((c) => c.subject === tutorClass.subject)
    .map((c) => c.topic);

  const tutorUser = tutorClass.tutorProfile.user;

  return (
    <ClassDetailsView
      backHref="/learner/classes"
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
            />
          </div>
        </div>
      }
      sessions={
        <>
          <h2 className="card-title text-sm font-bold">Sessions</h2>
          <SessionsList
            sessions={tutorClass.sessions.map((s) => ({ ...s, scheduledAt: s.scheduledAt.toISOString() }))}
          />
        </>
      }
      actions={
        <LearnerClassActions
          classId={tutorClass.id}
          status={tutorClass.status}
          isEnrolled={isEnrolled}
          isFull={tutorClass._count.enrollments >= tutorClass.maxStudents}
        />
      }
    />
  );
}
