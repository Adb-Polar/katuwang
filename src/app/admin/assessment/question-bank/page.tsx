import PageHeader from "@/components/ui/PageHeader";
import QuestionBankManager from "@/components/admin/QuestionBankManager";

export const metadata = {
  title: "Question Bank | Katuwang",
};

export default function AdminQuestionBankPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assessment"
        title="Question Bank"
        subtitle="Drill in by subject, then topic, to author single-answer questions and tune each topic's quiz."
      />
      <QuestionBankManager only="questions" />
    </div>
  );
}
