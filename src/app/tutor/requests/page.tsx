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
        subtitle="Learners ask for classes on topics they need help with. Accepting a request creates the class for you."
      />
      <TopicRequestBrowser />
    </div>
  );
}
