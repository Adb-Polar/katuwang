import { notFound } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import BackLink from "@/components/ui/BackLink";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import StatusText from "@/components/ui/StatusText";
import { formatDateTime } from "@/lib/datetime";
import { auditActionDisplayLabel, statusDisplayLabel } from "@/lib/displayLabels";
import { formatAuditReason } from "@/lib/auditLogDisplay";
import { gradeSection } from "@/lib/gradeLevels";
import UserAvatarModerationCard from "@/components/admin/UserAvatarModerationCard";
import { isAdminRole } from "@/lib/permissions";

export const metadata = { title: "User Detail | Katuwang" };

const STATUS_TONE = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "error",
  PENDING: "warning",
  DECLINED: "error",
} as const;

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getActiveServerSession();
  if (!session || !isAdminRole(session.user.role)) notFound();

  const user = await prisma.user.findFirst({
    where: { id, role: { notIn: ["ADMIN", "SUPER_ADMIN"] } },
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
      image: true,
      profilePictureLocked: true,
      profilePictureUpdatedAt: true,
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
    { label: "Role", value: idRole === "TUTOR" ? "Tutor" : "Learner" },
    { label: "Grade & section", value: gradeSection(user.gradeLevel, user.section) },
    { label: "Joined", value: formatDateTime(user.createdAt) },
  ];

  const counts =
    idRole === "TUTOR"
      ? [
          { label: "Classes", value: user.tutorProfile?._count.classes ?? 0 },
          { label: "Certifications", value: user.tutorProfile?._count.topicCertifications ?? 0 },
          { label: "Topic requests", value: user._count.topicRequests },
        ]
      : [
          { label: "Enrollment records", value: user._count.enrollments },
          { label: "Topic requests", value: user._count.topicRequests },
        ];

  return (
    <div className="space-y-6">
      <BackLink href="/admin/users">Back to accounts</BackLink>

      <PageHeader
        eyebrow="Admin Portal"
        title={`${user.firstName} ${user.lastName}`}
        subtitle="Read-only account context. Moderate from the accounts table."
        actions={<AnonymousIdText id={user.anonymousId} role={idRole} className="text-lg" />}
      />

      <section className="card kt-card">
        <div className="card-body gap-3 p-6">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-medium">Status</h2>
            <StatusText tone={STATUS_TONE[user.status]} label={statusDisplayLabel(user.status)} />
          </div>
          {user.status !== "ACTIVE" && (
            <div className="text-sm text-(--kt-muted) space-y-0.5">
              {user.statusReason && (
                <p>
                  <span className="font-medium">Reason:</span> {user.statusReason}
                </p>
              )}
              <p>
                <span className="font-medium">
                  {user.statusExpiresAt ? "In effect until:" : "Duration:"}
                </span>{" "}
                {user.statusExpiresAt ? formatDateTime(user.statusExpiresAt) : "Indefinite"}
              </p>
              {user.statusUpdatedAt && (
                <p>
                  <span className="font-medium">Updated:</span> {formatDateTime(user.statusUpdatedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <UserAvatarModerationCard
        userId={user.id}
        userName={`${user.firstName} ${user.lastName}`}
        initialImage={user.image}
        locked={user.profilePictureLocked}
        updatedAt={user.profilePictureUpdatedAt ? user.profilePictureUpdatedAt.toISOString() : null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card kt-card">
          <div className="card-body gap-2 p-6">
            <h2 className="font-serif text-xl font-medium">Account information</h2>
            <dl className="divide-y divide-(--kt-border)">
              {facts.map((f) => (
                <div key={f.label} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-3 py-3">
                  <dt className="text-sm text-(--kt-muted)">{f.label}</dt>
                  <dd className="font-medium break-words">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="card kt-card">
          <div className="card-body gap-2 p-6">
            <h2 className="font-serif text-xl font-medium">Activity</h2>
            {counts.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-1.5">
                <span className="text-(--kt-muted)">{c.label}</span>
                <span className="font-semibold tabular-nums">{c.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card kt-card">
        <div className="card-body gap-3 p-6">
          <h2 className="font-serif text-xl font-medium">Recent moderation history</h2>
          {auditEntries.length === 0 ? (
            <p className="text-(--kt-muted)">No audit-log entries reference this account.</p>
          ) : (
            <ul className="divide-y divide-(--kt-border)">
              {auditEntries.map((a) => {
                const summary = formatAuditReason(a.reason);
                return (
                  <li key={a.id} className="py-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                      <span className="font-medium">{auditActionDisplayLabel(a.action)}</span>
                      <span className="text-sm text-(--kt-muted) shrink-0">{formatDateTime(a.createdAt)}</span>
                    </div>
                    {summary && <p className="mt-1 break-words text-sm text-(--kt-muted)">{summary}</p>}
                    <p className="mt-1 text-sm text-(--kt-muted)">
                      by <AnonymousIdText id={a.admin.anonymousId} role="ADMIN" />
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
