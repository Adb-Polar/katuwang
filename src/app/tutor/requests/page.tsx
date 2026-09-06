import PageHeader from "@/components/ui/PageHeader";
import TopicRequestBrowser from "@/components/tutor/TopicRequestBrowser";

export const metadata = {
  title: "Class Requests | Katuwang",
};

export default function TutorRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Class requests"
        subtitle="Accept a request to auto-create a class for it — certification required per topic."
      />
      <TopicRequestBrowser />
    </div>
  );
}
