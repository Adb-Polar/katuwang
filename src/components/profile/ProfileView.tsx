import { ShieldCheck } from "lucide-react";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import PageHeader from "@/components/ui/PageHeader";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

/**
 * Shared account page for learners and tutors — read-only identity fields the
 * account owner can't change themselves, plus the self-service edit card
 * (grade level, section, contact info). The two portals differ only by
 * eyebrow / role label / ID role / endpoint.
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
  const identityRows: { label: string; value: React.ReactNode }[] = [
    { label: "Real name", value: <span className="font-semibold">{fullName}</span> },
    { label: "Email", value: <span className="font-semibold break-all">{email}</span> },
    {
      label: "Anonymous ID",
      value: <AnonymousIdBadge id={anonymousId} role={idRole} />,
    },
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

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Read-only identity */}
        <section className="card kt-card lg:col-span-2">
          <div className="card-body gap-4 p-6">
            <div>
              <h2 className="card-title text-sm font-bold">Identity</h2>
              <p className="text-2xs text-base-content/60 mt-1 flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-px text-success" />
                Name and email are managed by an administrator.
              </p>
            </div>
            <dl className="divide-y divide-base-200">
              {identityRows.map((r) => (
                <div key={r.label} className="grid gap-0.5 py-3 text-sm">
                  <dt className="text-2xs uppercase tracking-wide text-base-content/45">{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Self-service fields */}
        <section className="card kt-card lg:col-span-3">
          <div className="card-body gap-4 p-6">
            <div>
              <h2 className="card-title text-sm font-bold">Editable details</h2>
              <p className="text-2xs text-base-content/60 mt-1">
                Keep your grade level, section, and contact info up to date so tutors and admins can reach you.
              </p>
            </div>
            <div className="divider my-0"></div>
            <ProfileEditForm
              endpoint={endpoint}
              initialContactInfo={contactInfo}
              initialSection={section}
              initialGradeLevel={gradeLevel ?? ""}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
