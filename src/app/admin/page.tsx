import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowRight, ScrollText } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Metadata } from "next";

export const metadata : Metadata = {
  title: "Admin Dashboard | Katuwang",
};

function fmt(d: Date) {
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

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

  const actions = [
    { label: "Pending registrations", value: pendingRegistrationCount, href: "/admin/registrations" },
    { label: "Pending certifications", value: pendingCertCount, href: "/admin/certifications" },
    { label: "Open question requests", value: openQuestionRequestCount, href: "/admin/assessment/requests" },
    { label: "Open topic requests", value: openTopicRequestCount, href: "/admin/topic-requests" },
    { label: "Flagged accounts", value: flaggedAccountCount, href: "/admin/users" },
    { label: "Active classes", value: activeClassCount, href: "/admin/classes" },
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
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Learners</span>
          <span className="kt-stat-value">{learnerCount}</span>
        </div>
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Tutors</span>
          <span className="kt-stat-value">{tutorCount}</span>
        </div>
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Flagged Accounts</span>
          <span className="kt-stat-value">{flaggedAccountCount}</span>
        </div>
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Active Classes</span>
          <span className="kt-stat-value">{activeClassCount}</span>
        </div>
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
                      <span className="text-base-content/50 shrink-0">{fmt(log.createdAt)}</span>
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
                  <span className="kt-badge kt-badge--neutral">{a.value}</span>
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
