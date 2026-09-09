import PageHeader from "@/components/ui/PageHeader";
import UserManagementTable from "@/components/admin/UserManagementTable";
import { Metadata } from "next";

export const metadata : Metadata = {
  title: "Manage Users | Katuwang",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Learner & Tutor Accounts"
        subtitle="Review accounts and suspend or ban ones that violate platform policy."
      />
      <UserManagementTable />
    </div>
  );
}
