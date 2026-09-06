import PageHeader from "@/components/ui/PageHeader";
import NotificationList from "@/components/notifications/NotificationList";

export const metadata = {
  title: "Notifications | Katuwang",
};

export default function TutorNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Notifications"
        subtitle="Updates about class requests directed to you and your classes."
      />
      <NotificationList />
    </div>
  );
}
