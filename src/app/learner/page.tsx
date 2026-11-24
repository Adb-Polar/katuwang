import { getServerSession } from "next-auth";
import Link from "next/link";
import { CalendarClock, BookOpen, Inbox, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatCard, { type StatCardProps } from "@/components/ui/StatCard";
import RecentNotificationsCard from "@/components/notifications/RecentNotificationsCard";
import WeeklyTimetable from "@/components/schedule/WeeklyTimetable";
import { addDays, formatTime, formatWeekday } from "@/lib/datetime";

export const metadata = {
  title: "Overview | Katuwang",
};

export default async function LearnerOverview() {
  const session = await getServerSession(authOptions);
  const learnerId = session!.user.id;

  const now = new Date();
  const weekAhead = addDays(now, 7);

  const [enrolledCount, openRequestCount, upcomingSessions, weeklySessions, completedSessionCount, postTests] = await Promise.all([
    prisma.classEnrollment.count({ where: { learnerId } }),
    prisma.topicRequest.count({ where: { learnerId, status: "OPEN" } }),
    prisma.classSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gt: now },
        class: { enrollments: { some: { learnerId } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      select: {
        id: true,
        topic: true,
        scheduledAt: true,
        duration: true,
        class: { select: { id: true, subject: true } },
      },
    }),
    prisma.classSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gt: now, lte: weekAhead },
        class: { enrollments: { some: { learnerId } } },
      },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        topic: true,
        scheduledAt: true,
        duration: true,
        class: { select: { id: true, subject: true } },
      },
    }),
    prisma.classSession.count({
      where: { status: "COMPLETED", class: { enrollments: { some: { learnerId } } } },
    }),
    prisma.sessionTestAttempt.aggregate({
      where: { learnerId, kind: "POST", status: "SUBMITTED" },
      _count: { _all: true },
      _avg: { scorePercent: true },
    }),
  ]);

  const postTestCount = postTests._count._all;
  const progressRows: { label: string; value: string }[] = [
    { label: "Sessions completed", value: String(completedSessionCount) },
    { label: "Post-tests taken", value: String(postTestCount) },
    {
      label: "Average post-test score",
      value: postTests._avg.scorePercent === null ? "—" : `${Math.round(postTests._avg.scorePercent)}%`,
    },
  ];

  const timetableSessions = weeklySessions.map((s) => ({
    id: s.id,
    topic: s.topic,
    subject: s.class.subject,
    classId: s.class.id,
    scheduledAt: s.scheduledAt.toISOString(),
    duration: s.duration,
  }));

  const stats: StatCardProps[] = [
    {
      label: "Enrolled classes",
      value: enrolledCount,
      href: "/learner/my-classes",
      icon: BookOpen,
      tint: "primary",
    },
    {
      label: "Sessions this week",
      value: weeklySessions.length,
      href: "/learner/my-classes",
      icon: CalendarClock,
      tint: "secondary",
    },
    {
      label: "Open requests",
      value: openRequestCount,
      href: "/learner/requests",
      icon: Inbox,
      tint: "accent",
    },
    {
      label: "Sessions completed",
      value: completedSessionCount,
      href: "/learner/progress",
      icon: TrendingUp,
      tint: "success",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Welcome back"
        subtitle="Surfacing only anonymized data to protect your identity."
        actions={<AnonymousIdBadge id={session!.user.anonymousId} role="LEARNER" size="md" showIcon />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card kt-card">
          <div className="card-body gap-3">
            <h2 className="card-title text-sm font-bold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Upcoming sessions
            </h2>
            {upcomingSessions.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 border border-dashed border-base-300 rounded-lg py-10 px-4 text-center">
                <CalendarClock className="h-7 w-7 text-base-content/30" />
                <p className="text-sm text-base-content/70">You have no upcoming sessions.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/learner/classes" className="btn btn-primary btn-sm text-xs">
                    Browse classes
                  </Link>
                  <Link href="/learner/match" className="btn btn-outline btn-sm text-xs">
                    Try Auto Match
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcomingSessions.map((s) => {
                  const d = new Date(s.scheduledAt);
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/learner/classes/${s.class.id}?from=browse`}
                        className="flex items-center gap-3 rounded-lg border border-base-200 bg-base-200/20 hover:bg-base-200/50 hover:border-primary/30 p-3 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 text-primary px-2.5 py-1.5 shrink-0 w-14">
                          <span className="text-2xs font-bold uppercase leading-none">
                            {formatWeekday(d)}
                          </span>
                          <span className="text-base font-bold leading-tight">{d.getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-neutral badge-sm text-2xs uppercase font-bold">
                              {s.class.subject}
                            </span>
                            <span className="text-sm font-semibold text-base-content/85 truncate">
                              {s.topic}
                            </span>
                          </div>
                          <p className="text-2xs text-base-content/55 mt-0.5">
                            {formatTime(d)} ·{" "}
                            {s.duration} min
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
        <section className="card kt-card">
          <div className="card-body gap-2">
            <h2 className="card-title text-sm font-bold">Quick links</h2>
            {[
              { label: "Browse classes", href: "/learner/classes", icon: BookOpen },
              { label: "Auto Match", href: "/learner/match", icon: Sparkles },
              { label: "My class requests", href: "/learner/requests", icon: Inbox },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between gap-2 py-2 text-xs font-medium text-base-content/80 hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>

        <section className="card kt-card">
          <div className="card-body gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="card-title text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Your progress
              </h2>
              <Link href="/learner/progress" className="link link-primary text-2xs font-bold flex items-center gap-1">
                Details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <dl className="space-y-2">
              {progressRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                  <dt className="text-base-content/70">{row.label}</dt>
                  <dd className="font-mono font-semibold">{row.value}</dd>
                </div>
              ))}
            </dl>
            {postTestCount === 0 && (
              <p className="text-2xs text-base-content/55">
                Take the post-test after a session to see how much you improved.
              </p>
            )}
          </div>
        </section>

        <RecentNotificationsCard userId={learnerId} notificationsHref="/learner/notifications" />
        </div>
      </div>

      <section className="card kt-card">
        <div className="card-body gap-2">
          <h2 className="card-title text-sm font-bold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            This week
          </h2>
          <p className="text-2xs text-base-content/50">
            Sessions across your enrolled classes over the next 7 days.
          </p>
          <WeeklyTimetable
            sessions={timetableSessions}
            hrefFor={(classId) => `/learner/classes/${classId}?from=browse`}
            emptyMessage="No sessions in the next 7 days. Browse classes to enroll."
          />
        </div>
      </section>
    </div>
  );
}
