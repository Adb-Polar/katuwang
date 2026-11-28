import PageHeader from "@/components/ui/PageHeader";
import MyReportsList from "@/components/reports/MyReportsList";

export const metadata = {
  title: "My Reports | Katuwang",
};

export default function TutorReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="My reports"
        subtitle="Reports you sent to the administrators about learners, and what happened to each."
      />
      <MyReportsList
        endpoint="/api/tutor/reports"
        emptyMessage="You haven't reported anyone. If a learner in one of your classes breaks the rules, use Report on their student page and you'll see what happens to it here."
      />
    </div>
  );
}
