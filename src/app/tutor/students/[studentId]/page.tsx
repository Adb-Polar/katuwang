import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import BackLink from "@/components/ui/BackLink";
import UserAvatar from "@/components/profile/UserAvatar";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { gradeNumber } from "@/lib/gradeLevels";
import ReportButton from "@/components/reports/ReportButton";
import { averageGain, studentSessionResults } from "@/lib/studentTestSummary";

export const metadata = {
  title: "Student Profile | Katuwang",
};

export default async function TutorStudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });
  if (!tutorProfile) notFound();

  // Only learners enrolled in one of THIS tutor's classes are viewable.
  const enrollments = await prisma.classEnrollment.findMany({
    where: { learnerId: studentId, class: { tutorProfileId: tutorProfile.id } },
    select: {
      enrolledAt: true,
      withdrawnAt: true,
      class: { select: { id: true, code: true, subject: true, topics: { select: { topic: true } } } },
      learner: { select: { anonymousId: true, image: true, gradeLevel: true, section: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (enrollments.length === 0) notFound();

  // Submitted session tests this learner took in this tutor's classes.
  const attempts = await prisma.sessionTestAttempt.findMany({
    where: {
      learnerId: studentId,
      status: "SUBMITTED",
      sessionTest: { session: { class: { tutorProfileId: tutorProfile.id } } },
    },
    select: {
      kind: true,
      scorePercent: true,
      sessionTest: {
        select: {
          session: { select: { id: true, topic: true, scheduledAt: true, class: { select: { id: true, code: true } } } },
        },
      },
    },
  });
  const results = studentSessionResults(attempts);
  const gain = averageGain(results);
  const activeClasses = enrollments.filter((enr) => !enr.withdrawnAt).length;

  const learner = enrollments[0].learner;
  const gradeLine = `Grade ${gradeNumber(learner.gradeLevel)} · Section ${learner.section}`;

  return (
    <div className="space-y-8">
      <BackLink href="/tutor/students">Back to students</BackLink>

      {/* The learner's ID is the heading, on the one tinted band in the learner colour (like the profile page). */}
      <section
        aria-labelledby="student-id"
        className="rounded-(--kt-radius-box) bg-secondary/10 px-5 py-6 sm:px-7 flex flex-col sm:flex-row sm:items-center gap-5"
      >
        <UserAvatar
          src={learner.image}
          anonymousId={learner.anonymousId}
          size="xl"
          role="LEARNER"
          subtitle={gradeLine}
        />
        <div className="min-w-0 space-y-1">
          <p className="font-serif italic text-base leading-none text-primary">Your student</p>
          <h1 id="student-id" className="kt-id kt-id--learner text-3xl sm:text-4xl leading-tight">
            {learner.anonymousId}
          </h1>
          <p>{gradeLine}</p>
          <p className="text-sm text-(--kt-muted)">
            Learners appear to tutors only by their ID — no real name, email or contact details.
          </p>
        </div>
        <div className="sm:ml-auto shrink-0">
          <ReportButton targetType="LEARNER" targetId={studentId} targetLabel={learner.anonymousId} endpoint="/api/tutor/reports" />
        </div>
      </section>

      {/* Wide screens: classes on the left, test results beside them, so the page fills its width. */}
      <div className="grid gap-8 items-start xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="card kt-card" aria-labelledby="student-classes">
          <div className="kt-card-body gap-2">
            <h2 id="student-classes" className="font-serif text-2xl font-medium leading-tight">
              Classes with you
            </h2>
            <ul>
              {enrollments.map((enr) => {
                const [firstTopic, ...otherTopics] = enr.class.topics.map((t) => t.topic);
                return (
                  <li
                    key={enr.class.id}
                    className={`grid gap-x-6 gap-y-1 py-4 border-b border-(--kt-border) last:border-b-0 sm:grid-cols-[1fr_auto] ${enr.withdrawnAt ? "text-(--kt-muted)" : ""}`}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="flex flex-wrap gap-x-1.5 text-sm text-(--kt-muted)">
                        <span className="whitespace-nowrap">{subjectDisplayLabel(enr.class.subject)}</span>
                        <span className="whitespace-nowrap">· {enr.class.code}</span>
                      </p>
                      <h3 className="font-serif text-lg font-medium leading-snug">
                        <Link href={`/tutor/classes/${enr.class.id}`} className="link link-hover">
                          {firstTopic ?? subjectDisplayLabel(enr.class.subject)}
                        </Link>
                      </h3>
                      {otherTopics.length > 0 && (
                        <ul className="pl-3 border-l-2 border-(--kt-border) text-sm leading-snug space-y-1">
                          {otherTopics.map((t) => <li key={t}>{t}</li>)}
                        </ul>
                      )}
                    </div>
                    <p className="text-sm text-(--kt-muted) sm:text-right">
                      Enrolled {formatDate(enr.enrolledAt)}
                      {enr.withdrawnAt && (
                        <span className="block text-error">Withdrew {formatDate(enr.withdrawnAt)}</span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <aside className="space-y-8">
          <section className="card kt-card" aria-labelledby="student-at-a-glance">
            <div className="kt-card-body gap-4">
              <h2 id="student-at-a-glance" className="font-serif text-2xl font-medium leading-tight">At a glance</h2>
              <dl className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm text-(--kt-muted)">Active classes</dt>
                  <dd className="font-serif text-3xl tabular-nums leading-tight">{activeClasses}</dd>
                </div>
                <div>
                  <dt className="text-sm text-(--kt-muted)">Sessions tested</dt>
                  <dd className="font-serif text-3xl tabular-nums leading-tight">{results.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-(--kt-muted)">Avg. change</dt>
                  <dd className="font-serif text-3xl tabular-nums leading-tight">
                    {gain === null ? "—" : `${gain > 0 ? "+" : ""}${gain}`}
                    {gain !== null && <span className="text-base text-(--kt-muted)"> pts</span>}
                  </dd>
                </div>
              </dl>
              <p className="text-sm text-(--kt-muted)">Average change is post-test minus pre-test, over sessions where both were taken.</p>
            </div>
          </section>

          <section className="card kt-card" aria-labelledby="student-tests">
            <div className="kt-card-body gap-2">
              <h2 id="student-tests" className="font-serif text-2xl font-medium leading-tight">Session test results</h2>
              {results.length === 0 ? (
                <p className="text-(--kt-muted)">No session tests taken in your classes yet.</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th className="text-right">Pre</th>
                      <th className="text-right">Post</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.sessionId}>
                        <td className="min-w-0">
                          <Link href={`/tutor/classes/${r.classId}/sessions/${r.sessionId}/test`} className="link link-hover">
                            {r.topic}
                          </Link>
                          <span className="block text-xs text-(--kt-muted)">
                            {r.classCode} · {formatDate(r.scheduledAt)}
                          </span>
                        </td>
                        <td className="text-right tabular-nums">{r.pre === null ? "—" : `${r.pre}%`}</td>
                        <td className="text-right tabular-nums">{r.post === null ? "—" : `${r.post}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
