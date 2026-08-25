import ClassBrowser from "@/components/learner/ClassBrowser";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Classes | Katuwang",
};

export default function LearnerClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Learner Portal" title="Browse classes" subtitle="Find a class that fits your subjects and schedule." />
      <ClassBrowser />
    </div>
  );
}
