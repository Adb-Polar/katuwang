import PageHeader from "@/components/ui/PageHeader";
import ReportsView from "@/components/admin/ReportsView";

export const metadata = {
  title: "Analytics | Katuwang",
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Platform Analytics"
        subtitle="Breakdown of users, classes, certifications, and enrollment activity."
      />
      <ReportsView />
    </div>
  );
}
