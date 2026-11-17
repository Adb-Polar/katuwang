import LearnerCertificateList from "@/components/certificates/LearnerCertificateList";
import PageHeader from "@/components/ui/PageHeader";
export const metadata = { title: "My Certificates | Katuwang" };
export default function MyCertificatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Mga natapos mo" title="My certificates" subtitle="One for each class your tutor marked complete." />
      <LearnerCertificateList />
    </div>
  );
}
