import PageHeader from "@/components/ui/PageHeader";
import ReportsView from "@/components/admin/ReportsView";

export const metadata = {
  title: "Reports | Katuwang",
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Platform Reports"
        subtitle="Breakdown of users, classes, certifications, and enrollment activity."
      />
      <ReportsView />
    </div>
  );
}
