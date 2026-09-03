import PageHeader from "@/components/ui/PageHeader";
import QuestionBankManager from "@/components/admin/QuestionBankManager";

export const metadata = {
  title: "Assessment Requests | Katuwang",
};

export default function AdminAssessmentRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assessment"
        title="Question Requests"
        subtitle="Review and resolve tutor requests for more questions on a given subject and topic."
      />
      <QuestionBankManager only="requests" />
    </div>
  );
}
