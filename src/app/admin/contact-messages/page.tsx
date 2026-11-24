import PageHeader from "@/components/ui/PageHeader";
import ContactMessageTable from "@/components/admin/ContactMessageTable";

export const metadata = {
  title: "Contact Messages | Katuwang",
};

export default function AdminContactMessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Contact Messages"
        subtitle="Messages sent through the public contact form — often from people who cannot sign in. Reply by email, then mark the message resolved."
      />
      <ContactMessageTable />
    </div>
  );
}
