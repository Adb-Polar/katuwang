import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ReportsView from "@/components/admin/ReportsView";
import { SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import { Metadata } from "next";

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
      <PageHeader eyebrow="Admin Portal" title="Dashboard" subtitle={`What needs a decision, and how the platform is being used. Times are in ${SCHOOL_TIME_ZONE_LABEL}.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Learners" value={learnerCount} href="/admin/users" />
        <StatCard label="Tutors" value={tutorCount} href="/admin/users" />
        <StatCard label="Scheduled classes" value={activeClassCount} href="/admin/classes" />
        <StatCard label="Waiting for a decision" value={queues.reduce((sum, q) => sum + q.value, 0) - flaggedAccountCount} hint="Across the queues below" />
      </div>

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

      <section aria-labelledby="analytics" className="flex flex-col gap-6">
        <div>
          <h2 id="analytics" className="font-serif text-2xl font-medium">Analytics</h2>
          <p className="text-sm text-(--kt-muted)">Users, classes, certifications and enrollment activity.</p>
        </div>
        <ReportsView />
      </section>
    </div>
  );
}
