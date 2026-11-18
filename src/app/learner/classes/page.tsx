import ClassBrowser from "@/components/learner/ClassBrowser";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Browse Classes | Katuwang",
};

export default function LearnerBrowseClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Browse classes"
        subtitle="Find a class on your topic at a time that works. Any grade level is open to you."
      />
      <ClassBrowser scope="browse" />
    </div>
  );
}
