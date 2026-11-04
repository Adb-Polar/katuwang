import PageHeader from "@/components/ui/PageHeader";
import { Suspense } from "react";
import LearnerUpdates from "@/components/learner/LearnerUpdates";

export const metadata = {
  title: "Updates | Katuwang",
};

export default function LearnerNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Updates"
        subtitle="Notifications and the reports you have filed."
      />
      <Suspense fallback={<div className="loading loading-spinner loading-md" />}><LearnerUpdates /></Suspense>
    </div>
  );
}
