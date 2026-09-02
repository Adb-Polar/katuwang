import Link from "next/link";
import ClassBrowser from "@/components/learner/ClassBrowser";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "My Classes | Katuwang",
};

export default function LearnerMyClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="My classes"
        subtitle="Classes you're enrolled in — upcoming, completed, and cancelled."
        actions={
          <Link href="/learner/classes" className="btn btn-ghost btn-sm text-xs">
            Browse more →
          </Link>
        }
      />
      <ClassBrowser scope="mine" />
    </div>
  );
}
