import PageHeader from "@/components/ui/PageHeader";
import CertificationReviewTable from "@/components/admin/CertificationReviewTable";

export const metadata = {
  title: "Review Certifications | Katuwang",
};

export default function AdminCertificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assessment"
        title="Tutor certifications"
        subtitle="Approve or reject pending topic certification requests from tutors."
      />
      <CertificationReviewTable />
    </div>
  );
}
