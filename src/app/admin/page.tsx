import { getServerSession } from "next-auth";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Users, GraduationCap, ShieldAlert, CalendarClock } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard, { type StatCardProps } from "@/components/ui/StatCard";
import LoadingRow from "@/components/ui/LoadingRow";
import ReportsView from "@/components/admin/ReportsView";
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
    openContactMessageCount,
    pendingReportCount,
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
      prisma.contactMessage.count({ where: { status: "OPEN" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
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
    { label: "Pending abuse reports", value: pendingReportCount, href: "/admin/abuse-reports", tone: "error" },
    { label: "Open contact messages", value: openContactMessageCount, href: "/admin/contact-messages", tone: "warning" },
    { label: "Flagged accounts", value: flaggedAccountCount, href: "/admin/users", tone: "error" },
    { label: "Active classes", value: activeClassCount, href: "/admin/classes", tone: "neutral" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Admin Dashboard"
        subtitle="What needs your attention right now, and how the platform is being used."
        actions={<StatusBadge tone="error" label="Admin" size="sm" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <section className="card kt-card">
        <div className="card-body gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="card-title text-sm font-bold">Needs attention</h2>
            <p className="text-2xs text-base-content/60">Signed in as {session!.user.fullName}.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between gap-2 rounded-lg border border-base-300 bg-base-200/40 px-3 py-2.5 text-xs font-medium text-base-content/80 hover:border-primary/40 hover:text-primary transition-colors"
              >
                <span>{a.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`kt-badge kt-badge--${a.value > 0 ? a.tone : "neutral"}`}>{a.value}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div>
          <h2 className="font-sans font-heavy text-lg">Analytics</h2>
          <p className="text-xs text-base-content/60">
            Enrollment activity and breakdowns of users, classes and certifications.
          </p>
        </div>
        <Suspense fallback={<LoadingRow />}>
          <ReportsView />
        </Suspense>
      </div>
    </div>
  );
}
