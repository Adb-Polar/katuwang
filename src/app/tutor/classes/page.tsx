import Link from "next/link";
import { Plus } from "lucide-react";
import ClassManagement from "@/components/tutor/ClassManagement";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "My Classes | Katuwang",
};

export default function TutorClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Your classes"
        subtitle="Open a class to schedule sessions and see its roster. Learners can find and enroll in published classes."
        actions={
          <Link href="/tutor/classes/new" className="btn btn-primary gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Schedule a class
          </Link>
        }
      />
      <ClassManagement />
    </div>
  );
}
