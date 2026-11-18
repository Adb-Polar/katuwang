import Link from "next/link";
import type { AttemptSummary } from "@/app/tutor/assessments/page";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { formatDate } from "@/lib/datetime";

export interface CertificationDetail {
  id: string;
  subject: string;
  topic: string;
  status: "PENDING" | "CERTIFIED" | "REJECTED";
  requestedAt: string;
  certifiedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  usedInClasses: { id: string; subject: string; status: string }[];
}

const STATUS_TEXT = {
  CERTIFIED: { className: "text-success", label: "Verified" },
  REJECTED: { className: "text-error", label: "Not verified" },
  PENDING: { className: "text-base-content", label: "Waiting for review" },
} as const;

const ATTEMPT_TEXT = {
  PASSED: { className: "text-success", label: "Passed" },
  FAILED: { className: "text-error", label: "Not passed" },
  IN_PROGRESS: { className: "text-base-content", label: "In progress" },
} as const;

const sectionTitle = "font-serif text-2xl font-medium leading-tight";
const rowClass = "px-5 py-4 border-b border-(--kt-border) last:border-b-0";

export default function AssessmentHistory({
  certifications,
  attempts,
}: {
  certifications: CertificationDetail[];
  attempts: AttemptSummary[];
}) {
  if (certifications.length === 0 && attempts.length === 0) {
    return <p className="kt-card px-5 py-6">You haven&apos;t taken any topic assessments yet.</p>;
  }

  return (
    <div className="space-y-6">
      {attempts.length > 0 && (
        <section aria-labelledby="attempts" className="kt-card">
          <h2 id="attempts" className={`${sectionTitle} px-5 py-4 border-b border-(--kt-border)`}>Attempts</h2>
          <ul>
            {attempts.map((a) => {
              const state = a.certificationEligible === false
                ? { className: "text-(--kt-muted)", label: "Practice only" }
                : ATTEMPT_TEXT[a.status];
              return (
                <li key={a.id} className={`${rowClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                  <div className="min-w-0">
                    <p className="font-medium leading-snug break-words">{a.topic}</p>
                    <p className="text-sm text-(--kt-muted)">
                      {subjectDisplayLabel(a.subject)} · attempt {a.attemptNo} · {formatDate(a.startedAt)}
                      {a.status !== "IN_PROGRESS" && <> · {a.scorePercent}% ({a.correctCount} of {a.questionCount})</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:shrink-0">
                    <span className={`text-sm font-medium ${state.className}`}>{state.label}</span>
                    <Link href={`/tutor/assessments/${a.id}`} className="btn btn-outline">
                      {a.status === "IN_PROGRESS" ? "Resume" : "Review"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {certifications.length > 0 && (
        <section aria-labelledby="topic-status" className="kt-card">
          <h2 id="topic-status" className={`${sectionTitle} px-5 py-4 border-b border-(--kt-border)`}>Topic status</h2>
          <ul>
            {certifications.map((c) => (
              <li key={c.id} className={`${rowClass} space-y-1`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug break-words">{c.topic}</p>
                    <p className="text-sm text-(--kt-muted)">
                      {subjectDisplayLabel(c.subject)}
                      {c.certifiedAt && ` · verified ${formatDate(c.certifiedAt)}`}
                      {c.status === "REJECTED" && c.reviewedAt && ` · reviewed ${formatDate(c.reviewedAt)}`}
                      {c.usedInClasses.length > 0 &&
                        ` · used in ${c.usedInClasses.length} class${c.usedInClasses.length === 1 ? "" : "es"}`}
                    </p>
                  </div>
                  <span className={`text-sm font-medium shrink-0 ${STATUS_TEXT[c.status].className}`}>
                    {STATUS_TEXT[c.status].label}
                  </span>
                </div>
                {c.status === "REJECTED" && c.reviewNote && <p className="text-sm text-error">Reviewer: {c.reviewNote}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
