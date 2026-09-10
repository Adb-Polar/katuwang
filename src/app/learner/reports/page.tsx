import PageHeader from "@/components/ui/PageHeader";
import MyReportsList from "@/components/learner/MyReportsList";

export const metadata = {
  title: "My Reports | Katuwang",
};

export default function LearnerReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="My Reports"
        subtitle="Reports you have filed against a tutor or a class. Administrators review each one privately."
      />
      <MyReportsList />
    </div>
  );
}
