import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import { formatDateTime, SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import { formatAuditReason } from "@/lib/auditLogDisplay";
import { Metadata } from "next";
import { auditActionDisplayLabel, statusDisplayLabel } from "@/lib/displayLabels";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const metadata : Metadata = {
  title: "Admin Dashboard | Katuwang",
};

export default async function AdminDashboard() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

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
      prisma.topicRequest.count({ where: { status: "OPEN", expiresAt: { gt: new Date() } } }),
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

  const queues = [
    { label: "Registrations to review", value: pendingRegistrationCount, href: "/admin/registrations" },
    { label: "Certification requests", value: pendingCertCount, href: "/admin/assessment/certifications" },
    { label: "Question requests", value: openQuestionRequestCount, href: "/admin/assessment/requests" },
    { label: "Open class requests", value: openTopicRequestCount, href: "/admin/topic-requests" },
    { label: "Class appeals", value: openClassAppealCount, href: "/admin/class-appeals" },
    { label: "Suspended or banned accounts", value: flaggedAccountCount, href: "/admin/users" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Admin Portal" title="Dashboard" subtitle={`What needs a decision, and what admins did last. Times are in ${SCHOOL_TIME_ZONE_LABEL}.`} />

      <nav aria-label="Platform numbers" className="flex flex-wrap gap-x-6 gap-y-2 -mt-4">
        <Link href="/admin/users" className="link link-hover text-primary">
          {plural(learnerCount, "learner", "learners")}
        </Link>
        <Link href="/admin/users" className="link link-hover text-primary">
          {plural(tutorCount, "tutor", "tutors")}
        </Link>
        <Link href="/admin/classes" className="link link-hover text-primary">
          {plural(activeClassCount, "scheduled class", "scheduled classes")}
        </Link>
      </nav>

      <section aria-labelledby="needs-attention" className="kt-card">
        <h2 id="needs-attention" className="font-serif text-xl font-medium px-5 py-4 border-b border-(--kt-border)">
          Needs attention
        </h2>
        <ul>
          {queues.map((q) => (
            <li key={q.href} className="border-b border-(--kt-border) last:border-b-0">
              <Link
                href={q.href}
                className="flex! w-full items-center justify-between gap-4 px-5 py-3 hover:bg-base-200"
              >
                <span className={q.value > 0 ? "text-base-content" : "text-(--kt-muted)"}>{q.label}</span>
                <span className={`tabular-nums ${q.value > 0 ? "font-semibold text-primary" : "text-(--kt-muted)"}`}>
                  {q.value > 0 ? q.value : "None"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-activity" className="kt-card">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-(--kt-border)">
          <h2 id="recent-activity" className="font-serif text-xl font-medium">
            Recent activity
          </h2>
          <Link href="/admin/audit-log" className="link link-hover text-primary text-sm">
            Full audit log
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="px-5 py-6 text-(--kt-muted)">No admin actions logged yet.</p>
        ) : (
          <ul>
            {recentLogs.map((log) => {
              const summary = formatAuditReason(log.reason);
              return (
                <li key={log.id} className="px-5 py-4 border-b border-(--kt-border) last:border-b-0">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <p className="min-w-0 break-words font-medium">
                      {auditActionDisplayLabel(log.action)}
                      <span className="font-normal text-(--kt-muted)"> · {statusDisplayLabel(log.targetType)}</span>
                    </p>
                    <p className="shrink-0 text-sm text-(--kt-muted)">{formatDateTime(log.createdAt)}</p>
                  </div>
                  {summary && <p className="mt-1 break-words text-sm text-(--kt-muted)">{summary}</p>}
                  <p className="mt-1 text-sm text-(--kt-muted)">
                    by <AnonymousIdText id={log.admin.anonymousId} role="ADMIN" />
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
