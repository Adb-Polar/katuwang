import PageHeader from "@/components/ui/PageHeader";
import ClassTestsTable from "@/components/admin/ClassTestsTable";

export const metadata = {
  title: "Class Tests | Katuwang",
};

export default function AdminClassTestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Class Tests"
        subtitle="Every tutor-built pre/post test and its learner results."
      />
      <ClassTestsTable />
    </div>
  );
}
