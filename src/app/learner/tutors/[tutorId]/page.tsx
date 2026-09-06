import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, User } from "lucide-react";
import TopicChip from "@/components/ui/TopicChip";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { getSetting } from "@/lib/settings";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import ClassCard from "@/components/classes/ClassCard";
import WeeklyScheduleView from "@/components/tutor/WeeklyScheduleView";
import RequestTopicButton from "@/components/learner/RequestTopicButton";
import { deriveWeeklyAvailability } from "@/lib/derivedAvailability";

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
  const me = session
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { gradeLevel: true } })
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

  const classes = tutor.tutorProfile.classes;

  const scheduleSlots = deriveWeeklyAvailability(
    classes.flatMap((c) =>
      c.sessions.map((s) => ({
        scheduledAt: s.scheduledAt,
        duration: s.duration,
        status: s.status,
      }))
    )
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
          <h2 className="card-title text-sm font-bold">Typical Weekly Schedule</h2>
          <p className="text-2xs text-base-content/50">
            Automatically derived from this tutor&apos;s upcoming class sessions.
          </p>
          <WeeklyScheduleView
            slots={scheduleSlots}
            emptyMessage="This tutor has no upcoming sessions scheduled."
          />
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Published Classes ({classes.length})</h2>
          {classes.length === 0 ? (
            <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-6 text-center">
              This tutor has no published classes right now.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {classes.map((c) => {
                const topics = c.topics.map((t) => t.topic);
                const verifiedTopics = certifiedTopics
                  .filter((cert) => cert.subject === c.subject)
                  .map((cert) => cert.topic);
                return (
                  <ClassCard
                    key={c.id}
                    code={c.code}
                    subject={c.subject}
                    gradeLevel={c.gradeLevel}
                    topics={topics}
                    verifiedTopics={verifiedTopics}
                    description={c.description}
                    sessions={c.sessions.map((s) => ({
                      scheduledAt: s.scheduledAt.toISOString(),
                      duration: s.duration,
                      status: s.status,
                    }))}
                    status={c.status}
                    enrolledCount={c._count.enrollments}
                    maxStudents={c.maxStudents}
                    activeLabel="Open"
                    href={`/learner/classes/${c.id}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
