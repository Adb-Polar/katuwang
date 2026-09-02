import PageHeader from "@/components/ui/PageHeader";
import ClassModerationTable from "@/components/admin/ClassModerationTable";

export const metadata = {
  title: "Manage Classes | Katuwang",
};

export default function AdminClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="All Classes"
        subtitle="Suspend a class that violates platform policy, or reinstate one."
      />
      <ClassModerationTable />
    </div>
  );
}
