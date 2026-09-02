import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import type { AttemptSummary } from "@/app/tutor/assessments/page";

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

const STATUS_BADGE = {
  CERTIFIED: { tone: "success", label: "Verified" },
  REJECTED: { tone: "error", label: "Not Passed" },
  PENDING: { tone: "warning", label: "Awaiting review" },
} as const;

const ATTEMPT_BADGE = {
  PASSED: { tone: "success", label: "Passed" },
  FAILED: { tone: "error", label: "Failed" },
  IN_PROGRESS: { tone: "warning", label: "In progress" },
} as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AssessmentHistory({
  certifications,
  attempts,
}: {
  certifications: CertificationDetail[];
  attempts: AttemptSummary[];
}) {
  if (certifications.length === 0 && attempts.length === 0) {
    return (
      <p className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
        You haven&apos;t taken any topic assessments yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {attempts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-base-content/70">Attempts</h3>
          {attempts.map((a) => (
            <div key={a.id} className="border border-base-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-xs text-base-content/80 truncate">{a.topic}</div>
                <div className="text-2xs text-base-content/50">
                  {a.subject} · attempt #{a.attemptNo} · {formatDate(a.startedAt)}
                  {a.status !== "IN_PROGRESS" && (
                    <> · {a.scorePercent}% ({a.correctCount}/{a.questionCount})</>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge
                  tone={ATTEMPT_BADGE[a.status].tone}
                  label={ATTEMPT_BADGE[a.status].label}
                  size="xs"
                />
                <Link
                  href={`/tutor/assessments/${a.id}`}
                  className="btn btn-outline btn-xs text-2xs font-bold"
                >
                  {a.status === "IN_PROGRESS" ? "Resume" : "Review"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {certifications.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-base-content/70">Topic status</h3>
          {certifications.map((c) => (
            <div key={c.id} className="border border-base-200 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-base-content/80 truncate">{c.topic}</div>
                  <div className="text-2xs text-base-content/50">{c.subject}</div>
                </div>
                <StatusBadge
                  tone={STATUS_BADGE[c.status].tone}
                  label={STATUS_BADGE[c.status].label}
                  size="xs"
                />
              </div>

              <div className="text-2xs text-base-content/50 flex flex-wrap gap-x-4 gap-y-1">
                {c.certifiedAt && <span>Certified {formatDate(c.certifiedAt)}</span>}
                {c.status === "REJECTED" && c.reviewedAt && <span>Reviewed {formatDate(c.reviewedAt)}</span>}
              </div>

              {c.status === "REJECTED" && c.reviewNote && (
                <p className="text-2xs text-error/80 bg-error/5 border border-error/20 rounded-lg px-2 py-1.5">
                  <span className="font-semibold">Reviewer feedback:</span> {c.reviewNote}
                </p>
              )}

              {c.usedInClasses.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {c.usedInClasses.map((cls) => (
                    <span key={cls.id} className="badge badge-outline badge-sm text-2xs">
                      {cls.status}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
