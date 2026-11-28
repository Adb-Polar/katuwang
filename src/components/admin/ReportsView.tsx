"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useThemeColors } from "@/components/charts";
import ReportDownloadButtons from "@/components/reports/ReportDownloadButtons";
import BreakdownChartCard from "@/components/admin/analytics/BreakdownChartCard";
import EnrollmentAnalytics from "@/components/admin/analytics/EnrollmentAnalytics";
import { statusDisplayLabel, subjectDisplayLabel } from "@/lib/displayLabels";

const REPORT_SCOPES = [
  ["overview", "Platform overview"],
  ["users", "Users registered"],
  ["classes", "Classes created"],
  ["enrollments", "Enrollments"],
  ["session-tests", "Session tests (pre/post)"],
  ["certifications", "Topic certifications"],
  ["audit-log", "Audit log"],
] as const;

/** Admin dashboard analytics: each chart loads and filters itself; the report export sits between them. */
export default function ReportsView() {
  const c = useThemeColors();
  const { data: session } = useSession();
  // The audit log is super-admin only, and so is its export.
  const reportScopes = REPORT_SCOPES.filter(([value]) => value !== "audit-log" || session?.user?.role === "SUPER_ADMIN");
  const [scope, setScope] = useState<string>("overview");

  return (
    <div className="space-y-6">
      <EnrollmentAnalytics />

      <section aria-labelledby="export-reports" className="card kt-card">
        <div className="card-body gap-3 p-5">
          <h2 id="export-reports" className="font-serif text-xl font-medium leading-tight">Generate a report</h2>
          <p className="text-sm text-(--kt-muted)">PDF for printing or submission, CSV for spreadsheets. Exports include real names and emails, so handle them under RA 10173.</p>
          <label className="flex flex-col gap-1 text-xs text-(--kt-muted) sm:max-w-xs">
            Report
            <select className="select select-bordered select-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
              {reportScopes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <ReportDownloadButtons endpoint="/api/admin/report" params={{ scope }} label="Date range" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownChartCard chart="usersByRole" title="Users by role" labelKey="role" color={c.primary} labelFormatter={statusDisplayLabel} />
        <BreakdownChartCard chart="usersByGradeLevel" title="Users by grade level" labelKey="gradeLevel" color={c.primary} labelFormatter={statusDisplayLabel} />
        <BreakdownChartCard chart="usersByStatus" title="Users by status" labelKey="status" color={c.secondary} labelFormatter={statusDisplayLabel} />
        <BreakdownChartCard chart="classesBySubject" title="Classes by subject" labelKey="subject" color={c.primary} labelFormatter={subjectDisplayLabel} />
        <BreakdownChartCard chart="classesByStatus" title="Classes by status" labelKey="status" color={c.secondary} labelFormatter={statusDisplayLabel} />
        <BreakdownChartCard chart="certificationsByStatus" title="Certifications by status" labelKey="status" color={c.secondary} labelFormatter={statusDisplayLabel} />
      </div>
    </div>
  );
}
