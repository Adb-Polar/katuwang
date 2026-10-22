import { Metadata } from "next";
import { getActiveServerSession } from "@/lib/serverSession";
import { notFound } from "next/navigation";
import { isSuperAdminRole } from "@/lib/permissions";
import PageHeader from "@/components/ui/PageHeader";
import AdminManagementTable from "@/components/admin/AdminManagementTable";

export const metadata: Metadata = {
  title: "Admin Management | Katuwang",
};

export default async function AdminAdminsPage() {
  const session = await getActiveServerSession();

  if (!session || !isSuperAdminRole(session.user.role)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin Portal"
        title="Platform Administrators"
        subtitle="Provision and manage platform administrator accounts, view roles, and manage access."
      />
      <AdminManagementTable />
    </div>
  );
}
