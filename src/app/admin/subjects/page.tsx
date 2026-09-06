import PageHeader from "@/components/ui/PageHeader";
import SubjectTopicManager from "@/components/admin/SubjectTopicManager";

export const metadata = {
  title: "Subjects & Topics | Katuwang",
};

export default function AdminSubjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Subjects & Topics"
        subtitle="The taxonomy used across classes, matching, class requests and assessments. Renaming a topic updates it everywhere it's already stored."
      />
      <SubjectTopicManager />
    </div>
  );
}
