import PageHeader from "@/components/ui/PageHeader";
import NotificationList from "@/components/notifications/NotificationList";

export const metadata = {
  title: "Notifications | Katuwang",
};

export default function LearnerNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Notifications"
        subtitle="Updates about your topic requests and classes."
      />
      <NotificationList />
    </div>
  );
}
