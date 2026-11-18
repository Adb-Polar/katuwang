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
        title="Administrators"
        subtitle="Create admin accounts and suspend or restore their access. Super admin accounts are protected."
      />
      <AdminManagementTable />
    </div>
  );
}
