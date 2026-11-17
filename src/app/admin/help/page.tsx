import PageHeader from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";
import HelpCenter from "@/components/help/HelpCenter";
import { HELP_CONTENT } from "@/lib/help/helpContent";

export const metadata = {
  title: "Help & FAQs | Katuwang",
};

export default async function AdminHelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tulong"
        title="Help & FAQs"
        subtitle={HELP_CONTENT.ADMIN.intro}
      />
      <HelpCenter role="ADMIN" chatAvailable={await getSetting("chatbotEnabled")} />
    </div>
  );
}
