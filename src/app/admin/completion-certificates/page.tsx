import CertificateList from "@/components/certificates/CertificateList";
import PageHeader from "@/components/ui/PageHeader";
export const metadata = { title: "Certificate Management | Katuwang" };
export default function CertificateManagementPage() {
  return <div className="space-y-6"><PageHeader eyebrow="Admin Portal" title="Certificate Management" subtitle="Review issued completion certificates and retry failed PDF or email delivery." /><CertificateList admin /></div>;
}
