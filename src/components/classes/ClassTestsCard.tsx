"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export interface ClassTestRow {
  id: string;
  kind: "PRE" | "POST";
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  questionCount?: number;
  attempt?: {
    id: string;
    status: "IN_PROGRESS" | "SUBMITTED";
    scorePercent: number;
    totalQuestions: number;
  } | null;
}

const KIND_LABEL = { PRE: "Pre-test", POST: "Post-test" } as const;
const STATUS_TONE = {
  DRAFT: { tone: "neutral", label: "Draft" },
  PUBLISHED: { tone: "success", label: "Open" },
  CLOSED: { tone: "warning", label: "Closed" },
} as const;

export default function ClassTestsCard({
  classId,
  audience,
  tests,
}: {
  classId: string;
  audience: "tutor" | "learner";
  tests: ClassTestRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const byKind = (k: "PRE" | "POST") => tests.find((t) => t.kind === k) ?? null;

  const createTest = async (kind: "PRE" | "POST") => {
    setBusy(kind);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title: `${KIND_LABEL[kind]}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create test.");
      router.push(`/tutor/classes/${classId}/tests/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="card-title text-sm font-bold">Pre / Post Tests</h2>
      <FeedbackBanner variant="error" message={error || null} />

      {(["PRE", "POST"] as const).map((kind) => {
        const test = byKind(kind);

        // ── Tutor, no test yet ──
        if (!test && audience === "tutor") {
          return (
            <div
              key={kind}
              className="flex items-center justify-between gap-3 p-3 border border-dashed border-base-300 rounded-xl text-xs"
            >
              <span className="text-base-content/60">{KIND_LABEL[kind]} — not created</span>
              <button
                onClick={() => createTest(kind)}
                disabled={busy === kind}
                className="btn btn-outline btn-primary btn-xs text-2xs font-bold cursor-pointer"
              >
                {busy === kind ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  `Create ${KIND_LABEL[kind].toLowerCase()}`
                )}
              </button>
            </div>
          );
        }

        if (!test) return null; // learner: nothing published for this kind

        const st = STATUS_TONE[test.status];

        return (
          <div
            key={kind}
            className="flex items-center justify-between gap-3 p-3 border border-base-200 bg-base-200/20 rounded-xl text-xs"
          >
            <div className="min-w-0">
              <div className="font-semibold text-base-content/80 truncate">
                {KIND_LABEL[kind]}: {test.title}
              </div>
              <div className="text-2xs text-base-content/50">
                {test.questionCount != null && `${test.questionCount} questions`}
                {audience === "learner" && test.attempt?.status === "SUBMITTED" && (
                  <> · scored {test.attempt.scorePercent}%</>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge tone={st.tone} label={st.label} size="xs" />

              {audience === "tutor" && (
                <>
                  <Link
                    href={`/tutor/classes/${classId}/tests/${test.id}`}
                    className="btn btn-outline btn-xs text-2xs font-bold"
                  >
                    {test.status === "DRAFT" ? "Build" : "View"}
                  </Link>
                  {test.status !== "DRAFT" && (
                    <Link
                      href={`/tutor/classes/${classId}/tests/${test.id}/results`}
                      className="btn btn-outline btn-primary btn-xs text-2xs font-bold"
                    >
                      Results
                    </Link>
                  )}
                </>
              )}

              {audience === "learner" && (
                <>
                  {test.attempt?.status === "SUBMITTED" ? (
                    <Link
                      href={`/learner/classes/${classId}/tests/${test.id}`}
                      className="btn btn-outline btn-xs text-2xs font-bold"
                    >
                      Review
                    </Link>
                  ) : test.attempt?.status === "IN_PROGRESS" ? (
                    <Link
                      href={`/learner/classes/${classId}/tests/${test.id}`}
                      className="btn btn-primary btn-xs text-2xs font-bold"
                    >
                      Resume
                    </Link>
                  ) : test.status === "PUBLISHED" ? (
                    <Link
                      href={`/learner/classes/${classId}/tests/${test.id}`}
                      className="btn btn-primary btn-xs text-2xs font-bold"
                    >
                      Take {KIND_LABEL[kind].toLowerCase()}
                    </Link>
                  ) : (
                    <span className="text-2xs text-base-content/40">Closed — not taken</span>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
