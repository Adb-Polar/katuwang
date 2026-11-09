import CertificateList from "@/components/certificates/CertificateList";
import PageHeader from "@/components/ui/PageHeader";
export const metadata = { title: "My Certificates | Katuwang" };
export default function MyCertificatesPage() {
  return <div className="space-y-6"><PageHeader eyebrow="Learner Portal" title="My Certificates" subtitle="Certificates earned through tutor-confirmed class completion." /><CertificateList /></div>;
}
