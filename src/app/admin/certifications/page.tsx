import { redirect } from "next/navigation";

// Certification review moved under the grouped "Assessment" section.
export default function AdminCertificationsRedirect() {
  redirect("/admin/assessment/certifications");
}
