import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export const metadata = {
  title: "Profile | Katuwang",
};

export default async function TutorProfilePage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { contactInfo: true, section: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tutor Portal" title="Your account" subtitle="Only you can see your real name and email." />
      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Account Info</h2>
          <div className="divider my-0"></div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-base-200">
              <span className="text-base-content/50">Real Name</span>
              <span className="font-semibold">{session?.user.fullName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-base-200">
              <span className="text-base-content/50">Email</span>
              <span className="font-semibold">{session?.user.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-base-200">
              <span className="text-base-content/50">Anonymous ID</span>
              <AnonymousIdBadge id={session!.user.anonymousId} role="TUTOR" />
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-base-content/50">Role</span>
              <span className="font-semibold text-accent-content">Student Tutor</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Edit Profile</h2>
          <p className="text-xs text-base-content/60">
            You can update your section and contact info yourself. Name, email, and grade level changes require an
            admin.
          </p>
          <div className="divider my-0"></div>
          <ProfileEditForm
            endpoint="/api/tutor/profile"
            initialContactInfo={user?.contactInfo ?? ""}
            initialSection={user?.section ?? ""}
          />
        </div>
      </section>
    </div>
  );
}
