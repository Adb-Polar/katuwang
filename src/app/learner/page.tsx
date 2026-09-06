import { getServerSession } from "next-auth";
import Link from "next/link";
import { CalendarClock, BookOpen, Inbox, Sparkles, ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

export const metadata = {
  title: "Learner Portal | Katuwang",
};

function fmt(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LearnerDashboard() {
  const session = await getServerSession(authOptions);
  const learnerId = session!.user.id;

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [enrolledCount, openRequestCount, upcomingSessions, sessionsThisWeek] = await Promise.all([
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
    prisma.classSession.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gt: now, lte: weekAhead },
        class: { enrollments: { some: { learnerId } } },
      },
    }),
  ]);

  const stats = [
    { label: "Enrolled classes", value: enrolledCount, href: "/learner/my-classes", icon: BookOpen },
    { label: "Sessions this week", value: sessionsThisWeek, href: "/learner/my-classes", icon: CalendarClock },
    { label: "Open requests", value: openRequestCount, href: "/learner/requests", icon: Inbox },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Welcome back"
        subtitle="Surfacing only anonymized data to protect your identity."
        actions={<AnonymousIdBadge id={session!.user.anonymousId} role="LEARNER" size="md" showIcon />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card kt-card kt-stat p-5 hover:border-primary/40 transition-colors"
          >
            <div className="kt-stat-top">
              <span className="kt-tile w-9 h-9">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="kt-stat-title">{s.label}</span>
            </div>
            <span className="kt-stat-value">{s.value}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card kt-card">
          <div className="card-body gap-3">
            <h2 className="card-title text-sm font-bold">Upcoming sessions</h2>
            {upcomingSessions.length === 0 ? (
              <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-6 text-center">
                No scheduled sessions yet. Browse classes to enroll.
              </p>
            ) : (
              <ul className="divide-y divide-base-200">
                {upcomingSessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/learner/classes/${s.class.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-xs hover:bg-base-200/40 -mx-2 px-2 rounded"
                    >
                      <div className="min-w-0">
                        <span className="kt-badge kt-badge--neutral uppercase mr-2">
                          {s.class.subject}
                        </span>
                        <span className="text-base-content/80">{s.topic}</span>
                      </div>
                      <span className="text-base-content/60 shrink-0">
                        {fmt(s.scheduledAt)} · {s.duration}m
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

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
      </div>
    </div>
  );
}
