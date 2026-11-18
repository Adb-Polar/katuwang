import CertificateList from "@/components/certificates/CertificateList";
import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { addDays, SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import WeekDayRail, { groupByDay } from "@/components/schedule/WeekDayRail";

export const metadata = {
  title: "Learner Portal | Katuwang",
};

const SESSION_SELECT = {
  id: true,
  topic: true,
  scheduledAt: true,
  duration: true,
  class: { select: { id: true, subject: true } },
} as const;

const learnerClassHref = (classId: string) => `/learner/classes/${classId}?from=browse`;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function LearnerDashboard() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const learnerId = session!.user.id;

  const now = new Date();
  const weekAhead = addDays(now, 7);
  const enrolled = { enrollments: { some: { learnerId, withdrawnAt: null } } };

  const [enrolledCount, openRequestCount, upcomingSessions, weeklySessions] = await Promise.all([
    prisma.classEnrollment.count({ where: { learnerId, withdrawnAt: null } }),
    prisma.topicRequest.count({ where: { learnerId, status: "OPEN", expiresAt: { gt: now } } }),
    // Only used when nothing is scheduled this week: "your next session is …".
    prisma.classSession.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gt: now }, class: enrolled },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      select: SESSION_SELECT,
    }),
    prisma.classSession.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gt: now, lte: weekAhead }, class: enrolled },
      orderBy: { scheduledAt: "asc" },
      select: SESSION_SELECT,
    }),
  ]);

  const days = groupByDay(weeklySessions);
  const laterDays = groupByDay(upcomingSessions);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Learner Portal"
        title="Your week"
        subtitle={`Your sessions for the next 7 days. Times are in ${SCHOOL_TIME_ZONE_LABEL}.`}
      />

      <nav aria-label="Your numbers" className="flex flex-wrap gap-x-6 gap-y-2 -mt-4">
        <Link href="/learner/my-classes" className="link link-hover text-primary">
          {plural(enrolledCount, "enrolled class", "enrolled classes")}
        </Link>
        <span className="text-(--kt-muted)">{plural(weeklySessions.length, "session", "sessions")} this week</span>
        <Link href="/learner/tutors?tab=requests" className="link link-hover text-primary">
          {plural(openRequestCount, "open topic request", "open topic requests")}
        </Link>
      </nav>

      <section aria-labelledby="this-week" className="kt-card">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-(--kt-border)">
          <h2 id="this-week" className="font-serif text-xl font-medium">
            This week
          </h2>
          <Link href="/learner/my-classes" className="link link-hover text-primary text-sm">
            My classes
          </Link>
        </div>

        {days.length > 0 ? (
          <WeekDayRail days={days} now={now} hrefFor={learnerClassHref} />
        ) : laterDays.length > 0 ? (
          <>
            <p className="px-5 pt-5 text-(--kt-muted)">Nothing scheduled in the next 7 days. Your next sessions:</p>
            <WeekDayRail days={laterDays} now={now} hrefFor={learnerClassHref} />
          </>
        ) : (
          <p className="px-5 py-6">
            No sessions yet.{" "}
            <Link href="/learner/classes" className="link text-primary">
              Browse classes
            </Link>{" "}
            to enroll in one.
          </p>
        )}
      </section>

      <CertificateList preview />
    </div>
  );
}
