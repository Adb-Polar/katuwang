"use client";

import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

interface Breakdown {
  count: number;
  [key: string]: string | number;
}

interface ReportsData {
  usersByRole: Breakdown[];
  usersByGradeLevel: Breakdown[];
  usersByStatus: Breakdown[];
  classesBySubject: Breakdown[];
  classesByStatus: Breakdown[];
  certificationsByStatus: Breakdown[];
  enrollments: { total: number; last30Days: number };
}

function BreakdownTable({ title, rows, labelKey }: { title: string; rows: Breakdown[]; labelKey: string }) {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body gap-3 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">{title}</h3>
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <tbody>
              {rows.map((row) => (
                <tr key={String(row[labelKey])}>
                  <td className="text-base-content/70">{String(row[labelKey]).replace(/_/g, " ")}</td>
                  <td className="text-right font-semibold">{row.count}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="text-center py-4 text-base-content/40 italic text-xs" colSpan={2}>
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportsView() {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/reports");
        if (!res.ok) throw new Error("Could not retrieve reports.");
        const json = await res.json();
        if (!cancelled) setReports(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not retrieve reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      {reports && (
        <>
          <div className="stats bg-base-100 shadow-md border border-base-200 w-full sm:w-auto flex-wrap">
            <div className="stat py-4">
              <div className="stat-title text-2xs">Total Enrollments</div>
              <div className="stat-value text-lg font-serif">{reports.enrollments.total}</div>
            </div>
            <div className="stat py-4">
              <div className="stat-title text-2xs">Enrollments (Last 30 Days)</div>
              <div className="stat-value text-lg font-serif">{reports.enrollments.last30Days}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BreakdownTable title="Users by Role" rows={reports.usersByRole} labelKey="role" />
            <BreakdownTable title="Users by Grade Level" rows={reports.usersByGradeLevel} labelKey="gradeLevel" />
            <BreakdownTable title="Users by Status" rows={reports.usersByStatus} labelKey="status" />
            <BreakdownTable title="Classes by Subject" rows={reports.classesBySubject} labelKey="subject" />
            <BreakdownTable title="Classes by Status" rows={reports.classesByStatus} labelKey="status" />
            <BreakdownTable
              title="Certifications by Status"
              rows={reports.certificationsByStatus}
              labelKey="status"
            />
          </div>
        </>
      )}
    </div>
  );
}
