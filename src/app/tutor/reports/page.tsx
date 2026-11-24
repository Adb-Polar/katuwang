import PageHeader from "@/components/ui/PageHeader";
import MyReportsList from "@/components/reports/MyReportsList";

export const metadata = {
  title: "My Reports | Katuwang",
};

export default function TutorReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="My Reports"
        subtitle="Reports you have filed about a learner. Administrators review each one privately — open a learner from Students to file one."
      />
      <MyReportsList endpoint="/api/tutor/reports" />
    </div>
  );
}
