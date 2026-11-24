import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import AuditLogTable from "@/components/admin/AuditLogTable";

export const metadata = {
  title: "Audit Log | Katuwang",
};

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user.isSuperAdmin) redirect("/unauthorized");

  const { q } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Audit Log"
        subtitle="A history of moderation actions taken by administrators. Visible to super admins only."
      />
      <AuditLogTable initialQuery={q ?? ""} />
    </div>
  );
}
