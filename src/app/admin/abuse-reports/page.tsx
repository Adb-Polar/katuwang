import PageHeader from "@/components/ui/PageHeader";
import AbuseReportTable from "@/components/admin/AbuseReportTable";
import { Metadata } from "next";

export const metadata : Metadata = {
  title: "Abuse Reports | Katuwang",
};

export default function AdminAbuseReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Portal"
        title="Abuse Reports"
        subtitle="Learners flagging a tutor or a class. Resolve or dismiss each report — any suspension or ban is done from the Users or Classes pages."
      />
      <AbuseReportTable />
    </div>
  );
}
