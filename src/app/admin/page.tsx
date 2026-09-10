import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowRight, ScrollText, Users, GraduationCap, ShieldAlert, CalendarClock } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard, { type StatCardProps } from "@/components/ui/StatCard";
import { formatDateTime } from "@/lib/datetime";
import { Metadata } from "next";

export const metadata : Metadata = {
  title: "Admin Dashboard | Katuwang",
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const [
    learnerCount,
    tutorCount,
    flaggedAccountCount,
    activeClassCount,
    pendingCertCount,
    pendingRegistrationCount,
    openQuestionRequestCount,
    openTopicRequestCount,
    openClassAppealCount,
    recentLogs,
  ] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT_LEARNER" } }),
      prisma.user.count({ where: { role: "STUDENT_TUTOR" } }),
      prisma.user.count({ where: { status: { notIn: ["ACTIVE", "PENDING"] } } }),
      prisma.tutorClass.count({ where: { status: "SCHEDULED" } }),
      prisma.topicCertification.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.questionRequest.count({ where: { status: "OPEN" } }),
      prisma.topicRequest.count({ where: { status: "OPEN" } }),
      prisma.classAppeal.count({ where: { status: "PENDING" } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          targetType: true,
          reason: true,
          createdAt: true,
          admin: { select: { anonymousId: true } },
        },
      }),
    ]);

  const statCards: StatCardProps[] = [
    { label: "Learners", value: learnerCount, icon: Users, tint: "primary" },
    { label: "Tutors", value: tutorCount, icon: GraduationCap, tint: "accent" },
    { label: "Flagged Accounts", value: flaggedAccountCount, icon: ShieldAlert, tint: "error" },
    { label: "Active Classes", value: activeClassCount, icon: CalendarClock, tint: "success" },
  ];

  // `tone` drives the count badge colour — only applied when value > 0, except
  // "Active classes" which is informational and stays neutral.
  const actions = [
    { label: "Pending registrations", value: pendingRegistrationCount, href: "/admin/registrations", tone: "warning" },
    { label: "Pending certifications", value: pendingCertCount, href: "/admin/assessment/certifications", tone: "warning" },
    { label: "Open question requests", value: openQuestionRequestCount, href: "/admin/assessment/requests", tone: "warning" },
    { label: "Open topic requests", value: openTopicRequestCount, href: "/admin/topic-requests", tone: "warning" },
    { label: "Open class appeals", value: openClassAppealCount, href: "/admin/class-appeals", tone: "warning" },
    { label: "Flagged accounts", value: flaggedAccountCount, href: "/admin/users", tone: "error" },
    { label: "Active classes", value: activeClassCount, href: "/admin/classes", tone: "neutral" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Admin Dashboard"
        subtitle="Manage system configurations, user logs, and platform reports."
        actions={<StatusBadge tone="error" label="Admin" size="sm" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card kt-card">
          <div className="card-body gap-3">
            <h2 className="card-title text-sm font-bold flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              Recent activity
            </h2>
            {recentLogs.length === 0 ? (
              <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-6 text-center">
                No audit-log entries yet.
              </p>
            ) : (
              <ul className="divide-y divide-base-200">
                {recentLogs.map((log) => (
                  <li key={log.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-base-content/80">
                        {log.action.replace(/_/g, " ")}
                        <span className="font-normal text-base-content/50"> · {log.targetType.toLowerCase()}</span>
                      </span>
                      <span className="text-base-content/50 shrink-0">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <div className="text-2xs text-base-content/50 mt-0.5">
                      by {log.admin.anonymousId}
                      {log.reason ? ` — ${log.reason}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/audit-log" className="text-xs text-primary font-medium hover:underline mt-1">
              View full audit log →
            </Link>
          </div>
        </section>

        <section className="card kt-card">
          <div className="card-body gap-2">
            <h2 className="card-title text-sm font-bold">Needs attention</h2>
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between gap-2 py-2 text-xs font-medium text-base-content/80 hover:text-primary"
              >
                <span>{a.label}</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`kt-badge kt-badge--${a.value > 0 ? a.tone : "neutral"}`}
                  >
                    {a.value}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
            <p className="text-2xs text-base-content/40 mt-1">
              Signed in as {session!.user.fullName}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
