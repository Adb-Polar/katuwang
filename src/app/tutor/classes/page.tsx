import ClassManagement from "@/components/tutor/ClassManagement";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "My Classes | Katuwang",
};

export default function TutorClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tutor Portal" title="Your classes" subtitle="Schedule sessions and manage your roster." />
      <ClassManagement />
    </div>
  );
}
