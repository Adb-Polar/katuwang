import PageHeader from "@/components/ui/PageHeader";
import { Suspense } from "react";
import LearnerUpdates from "@/components/learner/LearnerUpdates";

export const metadata = {
  title: "Notifications | Katuwang",
};

export default function LearnerNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Notifications"
        subtitle="Notifications and the reports you have filed."
      />
      <Suspense fallback={<div className="loading loading-spinner loading-md" />}><LearnerUpdates /></Suspense>
    </div>
  );
}
