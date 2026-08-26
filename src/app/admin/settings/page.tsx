import PageHeader from "@/components/ui/PageHeader";
import PlatformSettingsForm from "@/components/admin/PlatformSettingsForm";

export const metadata = {
  title: "Platform Settings | Katuwang",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Platform Settings"
        subtitle="Toggle platform-wide behavior for registration and class creation."
      />
      <PlatformSettingsForm />
    </div>
  );
}
