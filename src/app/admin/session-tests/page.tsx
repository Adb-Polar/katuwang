import PageHeader from "@/components/ui/PageHeader";
import SessionTestsTable from "@/components/admin/SessionTestsTable";

export const metadata = {
  title: "Session Tests | Katuwang",
};

export default function AdminSessionTestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Session Tests"
        subtitle="Every tutor-built session test and its learner pre/post results."
      />
      <SessionTestsTable />
    </div>
  );
}
