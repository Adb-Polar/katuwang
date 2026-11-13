import PageHeader from "@/components/ui/PageHeader";
import NotificationList from "@/components/notifications/NotificationList";

export const metadata = {
  title: "Notifications | Katuwang",
};

export default function TutorNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Notifications"
        subtitle="Notifications about class requests directed to you and your classes."
      />
      <NotificationList />
    </div>
  );
}
