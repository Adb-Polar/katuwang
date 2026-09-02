import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import PageHeader from "@/components/ui/PageHeader";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

/**
 * Shared account page for learners and tutors — a clean definition list of the
 * read-only identity fields plus the self-service edit card. The two portals
 * differ only by eyebrow / role label / ID role / endpoint.
 */
export default function ProfileView({
  eyebrow,
  roleLabel,
  roleLabelClass,
  idRole,
  endpoint,
  fullName,
  email,
  anonymousId,
  gradeLevel,
  section,
  contactInfo,
}: {
  eyebrow: string;
  roleLabel: string;
  roleLabelClass: string;
  idRole: "LEARNER" | "TUTOR";
  endpoint: string;
  fullName: string;
  email: string;
  anonymousId: string;
  gradeLevel?: string | null;
  section: string;
  contactInfo: string;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Real name", value: <span className="font-semibold">{fullName}</span> },
    { label: "Email", value: <span className="font-semibold break-all">{email}</span> },
    {
      label: "Anonymous ID",
      value: <AnonymousIdBadge id={anonymousId} role={idRole} />,
    },
    ...(gradeLevel
      ? [{ label: "Grade level", value: <span className="font-semibold">{gradeLevel.replace("_", " ")}</span> }]
      : []),
    { label: "Section", value: <span className="font-semibold">{section || "—"}</span> },
    { label: "Role", value: <span className={`font-semibold ${roleLabelClass}`}>{roleLabel}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title="Your account"
        subtitle="Only you and administrators can see your real name, email, and contact info."
        actions={<AnonymousIdBadge id={anonymousId} role={idRole} size="md" showIcon />}
      />

      <section className="card kt-card">
        <div className="card-body gap-4 p-6">
          <h2 className="card-title text-sm font-bold">Account information</h2>
          <dl className="divide-y divide-base-200">
            {rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-1 sm:gap-3 py-3 text-sm"
              >
                <dt className="text-base-content/50">{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-4 p-6">
          <h2 className="card-title text-sm font-bold">Edit profile</h2>
          <p className="text-xs text-base-content/60">
            You can update your section and contact info yourself. Name, email, and grade level changes require an
            administrator.
          </p>
          <div className="divider my-0"></div>
          <ProfileEditForm endpoint={endpoint} initialContactInfo={contactInfo} initialSection={section} />
        </div>
      </section>
    </div>
  );
}
