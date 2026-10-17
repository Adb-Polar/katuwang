import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperAdminRole } from "@/lib/permissions";
import PageHeader from "@/components/ui/PageHeader";
import AdminManagementTable from "@/components/admin/AdminManagementTable";

export const metadata: Metadata = {
  title: "Admin Management | Katuwang",
};

export default async function AdminAdminsPage() {
  const session = await getServerSession(authOptions);

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
