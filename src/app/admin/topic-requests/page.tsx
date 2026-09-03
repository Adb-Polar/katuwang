import PageHeader from "@/components/ui/PageHeader";
import TopicRequestModerationTable from "@/components/admin/TopicRequestModerationTable";

export const metadata = {
  title: "Topic Requests | Katuwang",
};

export default function AdminTopicRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Topic Requests"
        subtitle="Close a request that violates platform policy, or re-open one."
      />
      <TopicRequestModerationTable />
    </div>
  );
}
