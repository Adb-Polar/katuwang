"use client";

import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { violationLabel } from "@/lib/reportViolations";
import { formatDate } from "@/lib/datetime";
import { statusDisplayLabel, subjectDisplayLabel } from "@/lib/displayLabels";

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

const STATUS_TONE: Record<MyReport["status"], string> = {
  PENDING: "text-warning-content",
  RESOLVED: "text-success",
  DISMISSED: "text-(--kt-muted)",
};

const OUTCOME: Record<MyReport["status"], string> = {
  PENDING: "Waiting for an admin to review it.",
  RESOLVED: "An admin acted on this report",
  DISMISSED: "Closed without action",
};

/** The report form's option labels ("Other (describe below)") read oddly out of context. */
const reasonLabel = (v: string) => violationLabel(v).replace(/\s*\(describe below\)$/i, "");

function ReportTarget({ r }: { r: MyReport }) {
  if (r.targetType === "TUTOR") {
    return <span className="kt-id kt-id--tutor">{r.target.anonymousId ?? "Unknown tutor"}</span>;
  }
  return (
    <>
      {r.target.subject ? subjectDisplayLabel(r.target.subject) : "Class"}
      {r.target.code && <span className="font-serif text-(--kt-muted)"> · {r.target.code}</span>}
    </>
  );
}

export default function MyReportsList() {
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

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
  }, [retryKey]);

  if (loading) {
    return <p role="status" className="text-sm text-(--kt-muted)">Loading your reports…</p>;
  }

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />
      {error && <button type="button" className="btn btn-outline" onClick={() => { setError(""); setLoading(true); setRetryKey((key) => key + 1); }}>Try again</button>}

      {!error && reports.length === 0 ? (
        <section className="card kt-card">
          <p className="kt-card-body text-(--kt-muted)">
            You haven&apos;t reported anyone. If a tutor or class breaks the rules, use Report on their page and you&apos;ll see what happens to it here.
          </p>
        </section>
      ) : !error ? (
        <section className="card kt-card" aria-label="My reports">
          <ul>
            {reports.map((r) => (
              <li key={r.id} className="px-5 py-5 border-b border-(--kt-border) last:border-b-0 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="text-sm text-(--kt-muted)">
                      {r.targetType === "TUTOR" ? "Tutor" : "Class"} report · {formatDate(r.createdAt)}
                    </p>
                    <h3 className="font-serif text-xl font-medium leading-snug break-words"><ReportTarget r={r} /></h3>
                  </div>
                  <span className={`text-sm font-medium ${STATUS_TONE[r.status]}`}>{statusDisplayLabel(r.status)}</span>
                </div>

                <p className="break-words whitespace-pre-wrap">
                  <span className="font-medium">{r.violations.map(reasonLabel).join(", ")}</span>
                  {r.details && <span className="text-(--kt-muted)">: {r.details}</span>}
                </p>

                {r.status === "PENDING" ? (
                  <p className="text-sm text-(--kt-muted)">{OUTCOME.PENDING}</p>
                ) : (
                  <div className="border-l-2 border-(--kt-border) pl-4 space-y-0.5">
                    <p className="text-sm font-medium">
                      {OUTCOME[r.status]}
                      {r.reviewedAt && <span className="font-normal text-(--kt-muted)"> · {formatDate(r.reviewedAt)}</span>}
                    </p>
                    {r.resolutionNote && <p className="text-sm text-(--kt-muted) break-words">{r.resolutionNote}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
