import PageHeader from "@/components/ui/PageHeader";
import QuestionBankManager from "@/components/admin/QuestionBankManager";

export const metadata = {
  title: "Question Bank | Katuwang",
};

export default function AdminQuestionBankPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Assessment Question Bank"
        subtitle="Author single-answer questions per subject and topic, tune each topic's quiz, handle tutor requests for more questions, and review completed attempts."
      />
      <QuestionBankManager />
    </div>
  );
}
