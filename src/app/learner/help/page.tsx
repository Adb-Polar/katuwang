import PageHeader from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";
import HelpCenter from "@/components/help/HelpCenter";
import { HELP_CONTENT } from "@/lib/help/helpContent";

export const metadata = {
  title: "Help & FAQs | Katuwang",
};

export default async function LearnerHelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tulong"
        title="Help & FAQs"
        subtitle={HELP_CONTENT.LEARNER.intro}
      />
      <HelpCenter role="LEARNER" chatAvailable={await getSetting("chatbotEnabled")} />
    </div>
  );
}
