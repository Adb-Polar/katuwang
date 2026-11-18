import StudentRoster from "@/components/tutor/StudentRoster";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "My Students | Katuwang",
};

export default function TutorStudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Your students"
        subtitle="Everyone enrolled in your classes. Learners appear only by their ID."
      />
      <StudentRoster />
    </div>
  );
}
