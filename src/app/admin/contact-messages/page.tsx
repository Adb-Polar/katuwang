import PageHeader from "@/components/ui/PageHeader";
import ContactMessageInbox from "@/components/admin/ContactMessageInbox";

export const metadata = {
  title: "Contact messages | Katuwang",
};

export default function AdminContactMessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Contact messages"
        subtitle="Messages from the public contact form, mostly from people who cannot sign in. Reply by email, then mark the message as handled."
      />
      <ContactMessageInbox />
    </div>
  );
}
