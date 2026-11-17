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
  PENDING: "Waiting for an admin to review",
  RESOLVED: "An admin acted on this report",
  DISMISSED: "Closed without action",
};

function ReportTarget({ r }: { r: MyReport }) {
  if (r.targetType === "TUTOR") {
    return <>Tutor <span className="kt-id kt-id--tutor">{r.target.anonymousId ?? "unknown"}</span></>;
  }
  return (
    <>
      Class <span className="font-serif">{r.target.code ?? ""}</span>
      {r.target.subject && <span className="text-(--kt-muted)"> · {subjectDisplayLabel(r.target.subject)}</span>}
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
              <li key={r.id} className="px-5 py-4 border-b border-(--kt-border) last:border-b-0 space-y-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-medium"><ReportTarget r={r} /></span>
                  <span className={`text-sm font-medium ${STATUS_TONE[r.status]}`}>{statusDisplayLabel(r.status)}</span>
                </p>
                <p className="text-sm break-words whitespace-pre-wrap">
                  {r.violations.map(violationLabel).join(", ")}
                  {r.details && <span className="text-(--kt-muted)"> — {r.details}</span>}
                </p>
                <p className="text-sm text-(--kt-muted)">
                  Filed {formatDate(r.createdAt)} · {OUTCOME[r.status]}
                  {r.reviewedAt && r.status !== "PENDING" ? ` on ${formatDate(r.reviewedAt)}` : ""}
                </p>
                {r.resolutionNote && (
                  <p className="text-sm text-(--kt-muted) break-words">Admin note: {r.resolutionNote}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
