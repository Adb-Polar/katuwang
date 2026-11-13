import PageHeader from "@/components/ui/PageHeader";
import NotificationList from "@/components/notifications/NotificationList";

export const metadata = {
  title: "Notifications | Katuwang",
};

export default function AdminNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Notifications"
        subtitle="System and moderation updates."
      />
      <NotificationList />
    </div>
  );
}
