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
        eyebrow="Mga abiso"
        title="Notifications"
        subtitle="Updates about your classes and tests, and what happened to reports you filed."
      />
      <Suspense fallback={<p role="status" className="text-sm text-(--kt-muted)">Loading…</p>}><LearnerUpdates /></Suspense>
    </div>
  );
}
