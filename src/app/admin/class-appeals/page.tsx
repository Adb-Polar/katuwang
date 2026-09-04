import PageHeader from "@/components/ui/PageHeader";
import ClassAppealTable from "@/components/admin/ClassAppealTable";

export const metadata = {
  title: "Class Appeals | Katuwang",
};

export default function AdminClassAppealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Class Appeals"
        subtitle="Tutors contesting a suspension or ban on one of their classes. Approving an appeal reinstates the class."
      />
      <ClassAppealTable />
    </div>
  );
}
