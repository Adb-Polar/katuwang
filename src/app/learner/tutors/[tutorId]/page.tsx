import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, User } from "lucide-react";
import TopicChip from "@/components/ui/TopicChip";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { addDays } from "@/lib/datetime";
import { getSetting } from "@/lib/settings";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import WeeklyTimetable from "@/components/schedule/WeeklyTimetable";
import RequestTopicButton from "@/components/learner/RequestTopicButton";
import ReportButton from "@/components/learner/ReportButton";
import TutorProfileClassTabs, {
  type TutorProfileClass,
} from "@/components/learner/TutorProfileClassTabs";

export const metadata = {
  title: "Tutor Profile | Katuwang",
};

export default async function LearnerTutorProfilePage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const { tutorId } = await params;

  await reinstateExpiredClasses();

  const showRealNames = await getSetting("showTutorRealNames");
  const session = await getServerSession(authOptions);
  const meId = session?.user.id ?? null;
  const me = meId
    ? await prisma.user.findUnique({ where: { id: meId }, select: { gradeLevel: true } })
    : null;

  const tutor = await prisma.user.findFirst({
    where: { id: tutorId, role: "STUDENT_TUTOR" },
    select: {
      anonymousId: true,
      firstName: true,
      lastName: true,
      section: true,
      tutorProfile: {
        select: {
          topicCertifications: {
            where: { status: "CERTIFIED" },
            select: { subject: true, topic: true },
          },
          classes: {
            where: { published: true },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            include: {
              topics: { select: { topic: true } },
              sessions: { orderBy: { scheduledAt: "asc" } },
              _count: { select: { enrollments: true } },
              // Whether *this* learner is enrolled — gates visibility of
              // suspended/banned/completed classes.
              enrollments: { where: { learnerId: meId ?? "__no_user__" }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!tutor || !tutor.tutorProfile) notFound();

  const certifiedTopics = tutor.tutorProfile.topicCertifications;
  const bySubject = new Map<string, string[]>();
  for (const c of certifiedTopics) {
    bySubject.set(c.subject, [...(bySubject.get(c.subject) ?? []), c.topic]);
  }

  const allClasses = tutor.tutorProfile.classes;

  // A learner may only report a tutor whose class they have joined.
  const canReport = allClasses.some((c) => c.enrollments.length > 0);

  const toDto = (c: (typeof allClasses)[number]): TutorProfileClass => ({
    id: c.id,
    code: c.code,
    subject: c.subject,
    gradeLevel: c.gradeLevel,
    topics: c.topics.map((t) => t.topic),
    verifiedTopics: certifiedTopics
      .filter((cert) => cert.subject === c.subject)
      .map((cert) => cert.topic),
    description: c.description,
    sessions: c.sessions.map((s) => ({
      scheduledAt: s.scheduledAt.toISOString(),
      duration: s.duration,
      status: s.status,
    })),
    status: c.status,
    enrolledCount: c._count.enrollments,
    maxStudents: c.maxStudents,
  });

  // A stranger only sees SCHEDULED classes; suspended/banned/completed classes
  // surface only to a learner enrolled in them.
  const visibleClasses = allClasses.filter(
    (c) => c.status === "SCHEDULED" || c.enrollments.length > 0,
  );
  const activeClasses = visibleClasses.filter((c) => c.status !== "COMPLETED").map(toDto);
  const completedClasses = visibleClasses
    .filter((c) => c.status === "COMPLETED" && c.enrollments.length > 0)
    .map(toDto);

  // Mon–Sun timetable: upcoming SCHEDULED sessions in the next 7 days.
  const now = new Date();
  const weekAhead = addDays(now, 7);
  const timetableSessions = allClasses
    .filter((c) => c.status === "SCHEDULED")
    .flatMap((c) =>
      c.sessions
        .filter((s) => s.status === "SCHEDULED" && s.scheduledAt > now && s.scheduledAt <= weekAhead)
        .map((s) => ({
          id: s.id,
          topic: s.topic,
          subject: c.subject,
          classId: c.id,
          scheduledAt: s.scheduledAt.toISOString(),
          duration: s.duration,
        })),
    );

  return (
    <div className="space-y-6">
      <Link href="/learner/classes" className="btn btn-ghost btn-sm text-xs gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to classes
      </Link>

      <PageHeader
        eyebrow="Tutor Profile"
        title={showRealNames ? `${tutor.firstName} ${tutor.lastName}` : "Anonymized profile"}
        subtitle={
          showRealNames
            ? "Real names are shown here because an administrator has enabled it."
            : "Learners and tutors never see each other's real names or contact details."
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <AnonymousIdBadge id={tutor.anonymousId} role="TUTOR" size="md" showIcon />
            <RequestTopicButton
              tutorId={tutorId}
              tutorAnonymousId={tutor.anonymousId}
              defaultGrade={me?.gradeLevel ?? undefined}
              verifiedTopicsHint={certifiedTopics.map((c) => `${c.topic}`)}
            />
            {canReport && (
              <ReportButton targetType="TUTOR" targetId={tutorId} targetLabel={tutor.anonymousId} />
            )}
          </div>
        }
      />

      {showRealNames && (
        <section className="card kt-card">
          <div className="card-body gap-2">
            <h2 className="card-title text-sm font-bold">Tutor</h2>
            <div className="flex items-center gap-2 text-xs text-base-content/80">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold">
                {tutor.firstName} {tutor.lastName}
              </span>
              <span className="text-base-content/50">· Section {tutor.section}</span>
            </div>
          </div>
        </section>
      )}

      <section className="card kt-card">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold">Verified Topics</h2>
          {bySubject.size === 0 ? (
            <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
              This tutor doesn&apos;t have any verified topics yet.
            </p>
          ) : (
            <div className="space-y-2">
              {Array.from(bySubject.entries()).map(([subject, topics]) => (
                <div key={subject} className="border border-base-200 bg-base-200/20 rounded-lg p-3 space-y-1.5">
                  <span className="badge badge-neutral badge-sm text-2xs font-bold">{subject}</span>
                  <div className="flex flex-wrap gap-1">
                    {topics.map((t) => (
                      <TopicChip key={t} topic={t} verified />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-2">
          <h2 className="card-title text-sm font-bold">This week</h2>
          <p className="text-2xs text-base-content/50">
            This tutor&apos;s scheduled sessions over the next 7 days.
          </p>
          <WeeklyTimetable
            sessions={timetableSessions}
            hrefFor={(classId) => `/learner/classes/${classId}`}
            emptyMessage="This tutor has no sessions in the next 7 days."
          />
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Classes</h2>
          <TutorProfileClassTabs active={activeClasses} completed={completedClasses} />
        </div>
      </section>
    </div>
  );
}
