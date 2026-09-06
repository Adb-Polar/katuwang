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
  const { q } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Audit Log"
        subtitle="A history of moderation actions taken by administrators."
      />
      <AuditLogTable initialQuery={q ?? ""} />
    </div>
  );
}
