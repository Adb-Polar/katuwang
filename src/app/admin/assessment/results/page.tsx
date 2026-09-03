import PageHeader from "@/components/ui/PageHeader";
import QuestionBankManager from "@/components/admin/QuestionBankManager";

export const metadata = {
  title: "Assessment Results | Katuwang",
};

export default function AdminAssessmentResultsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assessment"
        title="Attempt Results"
        subtitle="Review completed certification attempts, scores, and per-question answers."
      />
      <QuestionBankManager only="results" />
    </div>
  );
}
