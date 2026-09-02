import PageHeader from "@/components/ui/PageHeader";
import RegistrationApprovalTable from "@/components/admin/RegistrationApprovalTable";

export const metadata = {
  title: "Registration Approvals | Katuwang",
};

export default function AdminRegistrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Registration Approvals"
        subtitle="Approve or decline new learner and tutor accounts awaiting review. Active only while 'Require admin approval for new registrations' is enabled in Settings."
      />
      <RegistrationApprovalTable />
    </div>
  );
}
