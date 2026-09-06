import PageHeader from "@/components/ui/PageHeader";
import NewClassForm from "@/components/tutor/NewClassForm";

export const metadata = {
  title: "Schedule a Class | Katuwang",
};

export default function NewClassPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Schedule a tutoring class"
        subtitle="Pick a subject and topics, add your sessions, and publish it for tutees to discover and enroll."
      />
      <NewClassForm />
    </div>
  );
}
