import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

/**
 * The self-service edit form on its own page (`/{role}/profile/edit`), mirroring
 * how class editing lives at `/tutor/classes/[id]/edit` rather than inline.
 */
export default function ProfileEditView({
  eyebrow,
  backHref,
  endpoint,
  contactInfo,
  section,
  gradeLevel,
}: {
  eyebrow: string;
  backHref: string;
  endpoint: string;
  contactInfo: string;
  section: string;
  gradeLevel: string;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={eyebrow}
        title="Edit your details"
        subtitle="Update your grade level, section, and contact info."
      />
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-base-content/60 hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
      </Link>
      <section className="card kt-card max-w-2xl">
        <div className="card-body gap-4 p-6">
          <ProfileEditForm
            endpoint={endpoint}
            initialContactInfo={contactInfo}
            initialSection={section}
            initialGradeLevel={gradeLevel}
          />
        </div>
      </section>
    </div>
  );
}
