import type { ReactNode } from "react";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";

function EditSection({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <section className="card kt-card" aria-labelledby={id}>
      <div className="kt-card-body gap-5">
        <div>
          <h2 id={id} className="font-serif text-2xl font-medium leading-tight">{title}</h2>
          <p className="text-sm text-(--kt-muted)">{note}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

/**
 * The self-service edit page (`/{role}/profile/edit`): photo, the fields a student may change, and
 * password — each as one section in the same style as the profile page it links back to.
 */
export default function ProfileEditView({
  eyebrow,
  backHref,
  endpoint,
  contactInfo,
  section,
  gradeLevel,
  image,
  profilePictureLocked = false,
}: {
  eyebrow: string;
  backHref: string;
  endpoint: string;
  contactInfo: string;
  section: string;
  gradeLevel: string;
  image?: string | null;
  profilePictureLocked?: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <BackLink href={backHref}>Back to profile</BackLink>
        <PageHeader eyebrow={eyebrow} title="Edit your details" />
      </div>

      {/* Wide screens: photo and details on the left, password beside them (same split as the profile page). */}
      <div className="grid gap-8 items-start xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-8">
      <EditSection id="edit-photo" title="Photo" note="A PNG, JPG or WebP image, up to 2MB.">
        <ProfilePictureUpload initialImage={image} locked={profilePictureLocked} />
      </EditSection>

      <EditSection id="edit-details" title="Your details" note="Your contact info stays between you and administrators.">
        <ProfileEditForm
          endpoint={endpoint}
          initialContactInfo={contactInfo}
          initialSection={section}
          initialGradeLevel={gradeLevel}
        />
      </EditSection>
        </div>

      <EditSection id="edit-password" title="Password" note="You'll be signed out after changing it.">
        <ChangePasswordForm endpoint={`${endpoint}/password`} />
      </EditSection>
      </div>
    </div>
  );
}
