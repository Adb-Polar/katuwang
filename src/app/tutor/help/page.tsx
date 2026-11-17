import PageHeader from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";
import HelpCenter from "@/components/help/HelpCenter";
import { HELP_CONTENT } from "@/lib/help/helpContent";

export const metadata = {
  title: "Help & FAQs | Katuwang",
};

export default async function TutorHelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tulong"
        title="Help & FAQs"
        subtitle={HELP_CONTENT.TUTOR.intro}
      />
      <HelpCenter role="TUTOR" chatAvailable={await getSetting("chatbotEnabled")} />
    </div>
  );
}
