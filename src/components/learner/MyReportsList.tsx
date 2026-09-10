"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { violationLabel } from "@/lib/reportViolations";
import { formatDate } from "@/lib/datetime";

interface MyReport {
  id: string;
  targetType: "TUTOR" | "CLASS";
  target: { anonymousId?: string | null; code?: string | null; subject?: string | null };
  violations: string[];
  details: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_BADGE: Record<MyReport["status"], string> = {
  PENDING: "badge-warning",
  RESOLVED: "badge-success",
  DISMISSED: "badge-ghost",
};

function targetLabel(r: MyReport) {
  if (r.targetType === "TUTOR") return r.target.anonymousId ?? "Tutor";
  return `${r.target.subject ?? ""} · ${r.target.code ?? ""}`.trim();
}

export default function MyReportsList() {
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/learner/reports");
        if (!res.ok) throw new Error("Could not load your reports.");
        const data = await res.json();
        if (!cancelled) setReports(data.reports ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />

      {reports.length === 0 ? (
        <div className="card kt-card">
          <div className="card-body items-center text-center gap-2 py-10">
            <Flag className="h-6 w-6 text-base-content/30" />
            <p className="text-sm text-base-content/50 italic">You haven&apos;t filed any reports.</p>
          </div>
        </div>
      ) : (
        reports.map((r) => (
          <section key={r.id} className="card kt-card">
            <div className="card-body gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-2xs font-semibold uppercase tracking-wider text-base-content/40">
                    {r.targetType === "TUTOR" ? "Tutor" : "Class"}
                  </span>
                  <p className="font-mono text-sm font-semibold">{targetLabel(r)}</p>
                </div>
                <span className={`badge badge-sm ${STATUS_BADGE[r.status]} text-2xs font-bold`}>
                  {r.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {r.violations.map((v) => (
                  <span key={v} className="badge badge-outline badge-sm text-2xs">
                    {violationLabel(v)}
                  </span>
                ))}
              </div>

              {r.details && (
                <p className="text-xs text-base-content/70 whitespace-pre-wrap">{r.details}</p>
              )}

              <p className="text-2xs text-base-content/40">Filed {formatDate(r.createdAt)}</p>

              {r.status !== "PENDING" && (
                <div className="rounded-lg border border-base-200 bg-base-200/30 p-3 text-xs space-y-1 mt-1">
                  <p className="font-semibold text-base-content/70">
                    {r.status === "RESOLVED" ? "An admin acted on this report." : "Closed without action."}
                    {r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ""}
                  </p>
                  {r.resolutionNote && (
                    <p className="text-base-content/70">
                      <span className="font-semibold">Admin note:</span> {r.resolutionNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
