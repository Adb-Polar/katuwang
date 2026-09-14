import PageHeader from "@/components/ui/PageHeader";
import PlatformSettingsForm from "@/components/admin/PlatformSettingsForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

export const metadata = {
  title: "Platform Settings | Katuwang",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Platform Settings"
        subtitle="Toggle platform-wide behavior for registration and class creation, and tune the assessment settings applied to every subject and topic."
      />
      <PlatformSettingsForm />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">My Account</h2>
          <ChangePasswordForm endpoint="/api/admin/profile/password" />
        </div>
      </section>
    </div>
  );
}
