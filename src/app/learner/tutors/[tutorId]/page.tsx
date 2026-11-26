import { notFound, redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import BackLink from "@/components/ui/BackLink";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { addDays } from "@/lib/datetime";
import { getSetting } from "@/lib/settings";
import { isStudentEligibleForTutor, isStudentEligibleForClass } from "@/lib/gradeLevels";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import WeeklyTimetable from "@/components/schedule/WeeklyTimetable";
import RequestTopicButton from "@/components/learner/RequestTopicButton";
import ReportButton from "@/components/learner/ReportButton";
import UserAvatar from "@/components/profile/UserAvatar";
import TutorProfileClassTabs, {
  type TutorProfileClass,
} from "@/components/learner/TutorProfileClassTabs";
import { tutorPublicFacts } from "@/lib/tutorPublicFacts";

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
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const meId = session?.user.id ?? null;
  const me = meId
    ? await prisma.user.findUnique({ where: { id: meId }, select: { gradeLevel: true } })
    : null;

  const tutor = await prisma.user.findFirst({
    where: { id: tutorId, role: "STUDENT_TUTOR" },
    select: {
      anonymousId: true,
      image: true,
      // Names leave the database only when an administrator has switched them on.
      firstName: showRealNames,
      lastName: showRealNames,
      section: true,
      gradeLevel: true,
      createdAt: true,
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
              _count: { select: { enrollments: { where: { withdrawnAt: null } } } },
              // Whether *this* learner is enrolled — gates visibility of
              // suspended/banned/completed classes.
              enrollments: { where: { learnerId: meId ?? "__no_user__", withdrawnAt: null }, select: { id: true } },
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
  const canReport = Boolean(meId && await prisma.classEnrollment.findFirst({ where: { learnerId: meId, class: { tutorProfile: { userId: tutorId } } }, select: { id: true } }));

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

  const isEnrolledIn = (c: (typeof allClasses)[number]) => c.enrollments.length > 0;
  const isClassEligible = (c: (typeof allClasses)[number]) =>
    isStudentEligibleForClass(me?.gradeLevel, tutor.gradeLevel, c.gradeLevel);

  // A stranger only sees SCHEDULED classes that they are eligible to enroll in;
  // suspended/banned/completed classes surface only to a learner enrolled in them.
  const visibleClasses = allClasses.filter(
    (c) => isEnrolledIn(c) || (c.status === "SCHEDULED" && isClassEligible(c)),
  );
  const activeClasses = visibleClasses.filter((c) => c.status !== "COMPLETED").map(toDto);
  const completedClasses = visibleClasses
    .filter((c) => c.status === "COMPLETED" && isEnrolledIn(c))
    .map(toDto);

  // Mon–Sun timetable: upcoming SCHEDULED sessions in the next 7 days.
  const now = new Date();
  const weekAhead = addDays(now, 7);
  const timetableSessions = allClasses
    .filter((c) => isEnrolledIn(c) || (c.status === "SCHEDULED" && isClassEligible(c)))
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

  const realName = showRealNames ? `${tutor.firstName} ${tutor.lastName}` : null;
  const sectionLine = tutor.section ? `Section ${tutor.section}` : null;
  const facts = tutorPublicFacts({
    gradeLevel: tutor.gradeLevel,
    section: tutor.section,
    certifiedSubjects: certifiedTopics.map((c) => c.subject),
    publishedClassCount: allClasses.length,
    completedSessionCount: allClasses.flatMap((c) => c.sessions).filter((s) => s.status === "COMPLETED").length,
    tutorSince: tutor.createdAt,
  });
  const canRequestTopic = isStudentEligibleForTutor(me?.gradeLevel, tutor.gradeLevel);

  return (
    <div className="space-y-8">
      <BackLink href="/learner/classes">Back to classes</BackLink>

      {/* The tutor's ID (or name, when an administrator shows names) is the heading, on the one tinted band in the tutor colour. */}
      <section
        aria-labelledby="tutor-heading"
        className="rounded-(--kt-radius-box) bg-(--kt-tint-tutor) px-5 py-6 sm:px-7 flex flex-col md:flex-row md:items-center gap-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0 flex-1">
          <UserAvatar
            src={tutor.image}
            name={realName}
            anonymousId={tutor.anonymousId}
            size="xl"
            role="TUTOR"
            subtitle={sectionLine}
          />
          <div className="min-w-0 space-y-1">
            <p className="font-serif italic text-base leading-none text-primary">Tutor profile</p>
            {realName ? (
              <>
                <h1 id="tutor-heading" className="font-serif text-3xl sm:text-4xl font-medium leading-tight">
                  {realName}
                </h1>
                <p>
                  <AnonymousIdText id={tutor.anonymousId} role="TUTOR" />
                  {sectionLine && <span className="text-(--kt-muted)"> · {sectionLine}</span>}
                </p>
              </>
            ) : (
              <h1 id="tutor-heading" className="kt-id kt-id--tutor text-3xl sm:text-4xl leading-tight">
                {tutor.anonymousId}
              </h1>
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pt-2 text-sm" data-block="tutor-facts">
              {facts.map((f) => (
                <div key={f.label} className="contents">
                  <dt className="text-(--kt-muted)">{f.label}</dt>
                  <dd className="font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-(--kt-muted)">
              {realName
                ? "Real names are shown here because an administrator has enabled it."
                : "Learners and tutors never see each other's real names or contact details."}
              {tutor.image && " Select the picture to see it full size."}
            </p>
          </div>
        </div>
        {(canRequestTopic || canReport) && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {canRequestTopic && (
              <RequestTopicButton
                tutorId={tutorId}
                tutorAnonymousId={tutor.anonymousId}
                defaultGrade={me?.gradeLevel ?? undefined}
                verifiedTopicsHint={certifiedTopics.map((c) => `${c.topic}`)}
              />
            )}
            {canReport && (
              <ReportButton targetType="TUTOR" targetId={tutorId} targetLabel={tutor.anonymousId} />
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="verified-topics" className="kt-card">
        <h2 id="verified-topics" className="font-serif text-xl font-medium px-5 py-4 border-b border-(--kt-border)">
          Verified topics
        </h2>
        {bySubject.size === 0 ? (
          <p className="px-5 py-5 text-(--kt-muted)">This tutor doesn&apos;t have any verified topics yet.</p>
        ) : (
          <dl className="px-5">
            {Array.from(bySubject.entries()).map(([subject, topics]) => (
              <div
                key={subject}
                className="grid gap-x-6 gap-y-1 py-4 border-b border-(--kt-border) last:border-b-0 sm:grid-cols-[14rem_1fr]"
              >
                <dt className="text-sm text-(--kt-muted) sm:pt-0.5">{subjectDisplayLabel(subject)}</dt>
                <dd>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-labelledby="this-week" className="kt-card">
        <div className="px-5 py-4 border-b border-(--kt-border)">
          <h2 id="this-week" className="font-serif text-xl font-medium">
            This week
          </h2>
          <p className="text-sm text-(--kt-muted)">This tutor&apos;s scheduled sessions over the next 7 days.</p>
        </div>
        <div className="kt-card-body">
          <WeeklyTimetable
            sessions={timetableSessions}
            hrefFor={(classId) => `/learner/classes/${classId}`}
            emptyMessage="This tutor has no sessions in the next 7 days."
          />
        </div>
      </section>

      <section aria-labelledby="tutor-classes" className="kt-card">
        <h2 id="tutor-classes" className="font-serif text-xl font-medium px-5 py-4 border-b border-(--kt-border)">
          Classes
        </h2>
        <div className="kt-card-body">
          <TutorProfileClassTabs active={activeClasses} completed={completedClasses} />
        </div>
      </section>
    </div>
  );
}
