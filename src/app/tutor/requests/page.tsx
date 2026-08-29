import PageHeader from "@/components/ui/PageHeader";
import TopicRequestQueue from "@/components/tutor/TopicRequestQueue";

export const metadata = {
  title: "Topic Requests | Katuwang",
};

export default function TutorRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Topic requests"
        subtitle="Learners asking for help. Attach one of your classes to respond."
      />
      <TopicRequestQueue />
    </div>
  );
}
