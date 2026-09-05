import PageHeader from "@/components/ui/PageHeader";
import ChatbotMissesTable from "@/components/admin/ChatbotMissesTable";

export const metadata = {
  title: "Chatbot | Katuwang",
};

export default function AdminChatbotPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Chatbot"
        subtitle="Questions the assistant couldn't answer, grouped by frequency — grow the FAQ knowledge base from real usage."
      />
      <ChatbotMissesTable />
    </div>
  );
}
