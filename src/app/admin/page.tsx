import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export const metadata = {
  title: "Admin Dashboard | Katuwang",
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const [learnerCount, tutorCount, flaggedAccountCount, activeClassCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT_LEARNER" } }),
    prisma.user.count({ where: { role: "STUDENT_TUTOR" } }),
    prisma.user.count({ where: { status: { not: "ACTIVE" } } }),
    prisma.tutorClass.count({ where: { status: "SCHEDULED" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Admin Dashboard"
        subtitle="Manage system configurations, user logs, and platform reports."
        actions={<StatusBadge tone="error" label="Admin" size="sm" />}
      />

      <div className="stats bg-base-100 shadow-md border border-base-200 w-full sm:w-auto flex-wrap">
        <div className="stat py-4">
          <div className="stat-title text-2xs">Learners</div>
          <div className="stat-value text-lg font-serif">{learnerCount}</div>
        </div>
        <div className="stat py-4">
          <div className="stat-title text-2xs">Tutors</div>
          <div className="stat-value text-lg font-serif">{tutorCount}</div>
        </div>
        <div className="stat py-4">
          <div className="stat-title text-2xs">Flagged Accounts</div>
          <div className="stat-value text-lg font-serif">{flaggedAccountCount}</div>
        </div>
        <div className="stat py-4">
          <div className="stat-title text-2xs">Active Classes</div>
          <div className="stat-value text-lg font-serif">{activeClassCount}</div>
        </div>
      </div>

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4 p-6">
          <h2 className="card-title text-sm font-bold">Admin Privileges</h2>
          <p className="text-xs text-base-content/70">
            Welcome, {session!.user.fullName}. Use the Users and Classes tabs to review and moderate accounts and
            scheduled sessions.
          </p>
        </div>
      </section>
    </div>
  );
}
