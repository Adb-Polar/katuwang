import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";

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
    <div className="space-y-5">
      <PageHeader
        eyebrow={eyebrow}
        title="Edit your details"
        subtitle="Update your profile photo, grade level, section, and contact info."
      />
      <BackLink href={backHref}>Back to profile</BackLink>

      <section className="card kt-card max-w-2xl">
        <div className="card-body gap-4 p-6">
          <ProfilePictureUpload initialImage={image} locked={profilePictureLocked} />
        </div>
      </section>

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

      <section className="card kt-card max-w-2xl">
        <div className="card-body gap-4 p-6">
          <h2 className="card-title text-sm font-bold">Change password</h2>
          <ChangePasswordForm endpoint={`${endpoint}/password`} />
        </div>
      </section>
    </div>
  );
}
