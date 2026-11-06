import Link from "next/link";
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
        subtitle="Discover upcoming classes for Grades 7–12. Choose any grade level, regardless of your own."
        actions={
          <Link href="/learner/my-classes" className="btn btn-ghost btn-sm text-xs">
            My classes →
          </Link>
        }
      />
      <ClassBrowser scope="browse" />
    </div>
  );
}
