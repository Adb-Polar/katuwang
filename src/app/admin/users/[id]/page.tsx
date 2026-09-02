import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";

export const metadata = { title: "User Detail | Katuwang" };

const STATUS_TONE = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "error",
  PENDING: "warning",
} as const;

function fmt(d: Date) {
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") notFound();

  const user = await prisma.user.findFirst({
    where: { id, role: { not: "ADMIN" } },
    select: {
      id: true,
      anonymousId: true,
      firstName: true,
      lastName: true,
      email: true,
      contactInfo: true,
      role: true,
      gradeLevel: true,
      section: true,
      status: true,
      statusReason: true,
      statusUpdatedAt: true,
      statusExpiresAt: true,
      createdAt: true,
      _count: { select: { enrollments: true, topicRequests: true } },
      tutorProfile: {
        select: {
          _count: { select: { classes: true, topicCertifications: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const idRole = user.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER";

  const auditEntries = await prisma.auditLog.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      action: true,
      reason: true,
      createdAt: true,
      admin: { select: { anonymousId: true } },
    },
  });

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Real name", value: `${user.firstName} ${user.lastName}` },
    { label: "Email", value: user.email },
    { label: "Contact info", value: user.contactInfo || "—" },
    { label: "Role", value: user.role.replace("STUDENT_", "").toLowerCase() },
    { label: "Grade & section", value: `${user.gradeLevel.replace("_", " ")} · ${user.section}` },
    { label: "Joined", value: fmt(user.createdAt) },
  ];

  const counts =
    idRole === "TUTOR"
      ? [
          { label: "Classes", value: user.tutorProfile?._count.classes ?? 0 },
          { label: "Certifications", value: user.tutorProfile?._count.topicCertifications ?? 0 },
          { label: "Topic requests", value: user._count.topicRequests },
        ]
      : [
          { label: "Enrollments", value: user._count.enrollments },
          { label: "Topic requests", value: user._count.topicRequests },
        ];

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="btn btn-ghost btn-sm text-xs gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to accounts
      </Link>

      <PageHeader
        eyebrow="Admin Portal"
        title={`${user.firstName} ${user.lastName}`}
        subtitle="Read-only account context. Moderate from the accounts table."
        actions={<AnonymousIdBadge id={user.anonymousId} role={idRole} size="md" showIcon />}
      />

      <section className="card kt-card">
        <div className="card-body gap-3 p-6">
          <div className="flex items-center gap-2">
            <h2 className="card-title text-sm font-bold">Status</h2>
            <StatusBadge tone={STATUS_TONE[user.status]} label={user.status} size="xs" />
          </div>
          {user.status !== "ACTIVE" && (
            <div className="text-xs text-base-content/70 space-y-0.5">
              {user.statusReason && (
                <p>
                  <span className="font-semibold">Reason:</span> {user.statusReason}
                </p>
              )}
              <p>
                <span className="font-semibold">
                  {user.statusExpiresAt ? "In effect until:" : "Duration:"}
                </span>{" "}
                {user.statusExpiresAt ? fmt(user.statusExpiresAt) : "Indefinite"}
              </p>
              {user.statusUpdatedAt && (
                <p>
                  <span className="font-semibold">Updated:</span> {fmt(user.statusUpdatedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card kt-card">
          <div className="card-body gap-2 p-6">
            <h2 className="card-title text-sm font-bold">Account information</h2>
            <dl className="divide-y divide-base-200">
              {facts.map((f) => (
                <div key={f.label} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-3 py-3 text-sm">
                  <dt className="text-base-content/50">{f.label}</dt>
                  <dd className="font-semibold break-all">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="card kt-card">
          <div className="card-body gap-2 p-6">
            <h2 className="card-title text-sm font-bold">Activity</h2>
            {counts.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-sm py-1.5">
                <span className="text-base-content/60">{c.label}</span>
                <span className="font-serif font-bold">{c.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card kt-card">
        <div className="card-body gap-3 p-6">
          <h2 className="card-title text-sm font-bold">Recent moderation history</h2>
          {auditEntries.length === 0 ? (
            <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-6 text-center">
              No audit-log entries reference this account.
            </p>
          ) : (
            <ul className="divide-y divide-base-200">
              {auditEntries.map((a) => (
                <li key={a.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-base-content/80">{a.action.replace(/_/g, " ")}</span>
                    <span className="text-base-content/50 shrink-0">{fmt(a.createdAt)}</span>
                  </div>
                  <div className="text-2xs text-base-content/50 mt-0.5">
                    by {a.admin.anonymousId}
                    {a.reason ? ` — ${a.reason}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
