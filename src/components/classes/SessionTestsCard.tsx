import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

export interface SessionTestRow {
  sessionId: string;
  topic: string;
  scheduledAt: string;
  test: { id: string; title: string; status: "DRAFT" | "PUBLISHED" | "CLOSED" } | null;
  /** learner audience only — needed to know whether the post window is open. */
  sessionStatus?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  pre?: { status: "IN_PROGRESS" | "SUBMITTED"; scorePercent: number } | null;
  post?: { status: "IN_PROGRESS" | "SUBMITTED"; scorePercent: number } | null;
}

function LearnerAction({ classId, row }: { classId: string; row: SessionTestRow }) {
  if (!row.test) return null;
  const href = (kind: "pre" | "post") => `/learner/classes/${classId}/sessions/${row.sessionId}/test/${kind}`;

  const preSubmitted = row.pre?.status === "SUBMITTED";
  const postSubmitted = row.post?.status === "SUBMITTED";
  const canTakePost = preSubmitted && row.test.status === "PUBLISHED" && row.sessionStatus === "COMPLETED";

  // The single "next thing to do" action, if any.
  let primary: React.ReactNode = null;
  if (row.post?.status === "IN_PROGRESS") {
    primary = (
      <Link href={href("post")} className="btn btn-primary btn-xs text-2xs font-bold">
        Resume post-test
      </Link>
    );
  } else if (canTakePost && !postSubmitted) {
    primary = (
      <Link href={href("post")} className="btn btn-primary btn-xs text-2xs font-bold">
        Take post-test
      </Link>
    );
  } else if (row.pre?.status === "IN_PROGRESS") {
    primary = (
      <Link href={href("pre")} className="btn btn-primary btn-xs text-2xs font-bold">
        Resume pre-test
      </Link>
    );
  } else if (!row.pre && !row.post && row.test.status === "PUBLISHED" && row.sessionStatus !== "COMPLETED") {
    primary = (
      <Link href={href("pre")} className="btn btn-primary btn-xs text-2xs font-bold">
        Take pre-test
      </Link>
    );
  }

  // Review links — one per phase the learner has already submitted, always
  // available (even after the test is closed) so a learner can go back to
  // either their pre-test or their post-test, not just the last one they took.
  const reviews: React.ReactNode[] = [];
  if (preSubmitted) {
    reviews.push(
      <Link key="pre" href={href("pre")} className="btn btn-outline btn-xs text-2xs font-bold">
        Review pre
      </Link>,
    );
  }
  if (postSubmitted) {
    reviews.push(
      <Link key="post" href={href("post")} className="btn btn-outline btn-xs text-2xs font-bold">
        Review post
      </Link>,
    );
  }

  if (!primary && reviews.length === 0) {
    return <span className="text-2xs text-base-content/40">Closed — not taken</span>;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {primary}
      {reviews}
    </div>
  );
}

const STATUS_TONE = {
  DRAFT: { tone: "neutral" as const, label: "Draft" },
  PUBLISHED: { tone: "success" as const, label: "Open" },
  CLOSED: { tone: "warning" as const, label: "Closed" },
};

/** Per-session pre/post test status — one row per `ClassSession`, not one per PRE/POST pair. */
export default function SessionTestsCard({
  classId,
  audience,
  rows,
}: {
  classId: string;
  audience: "tutor" | "learner";
  rows: SessionTestRow[];
}) {
  return (
    <div className="space-y-3">
      <h2 className="card-title text-sm font-bold">Session Tests</h2>

      {rows.length === 0 ? (
        <p className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
          No sessions yet.
        </p>
      ) : (
        rows.map((row) => {
          // Tutor, no test yet on this session.
          if (!row.test && audience === "tutor") {
            return (
              <div
                key={row.sessionId}
                className="flex items-center justify-between gap-3 p-3 border border-dashed border-base-300 rounded-xl text-xs"
              >
                <span className="text-base-content/60 truncate">{row.topic} — no test yet</span>
                <Link
                  href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test`}
                  className="btn btn-outline btn-primary btn-xs text-2xs font-bold shrink-0"
                >
                  Build test
                </Link>
              </div>
            );
          }

          if (!row.test) return null; // learner: nothing published for this session

          const st = STATUS_TONE[row.test.status];

          return (
            <div
              key={row.sessionId}
              className="flex items-center justify-between gap-3 p-3 border border-base-200 bg-base-200/20 rounded-xl text-xs"
            >
              <div className="min-w-0">
                <div className="font-semibold text-base-content/80 truncate">
                  {row.topic}: {row.test.title}
                </div>
                {audience === "learner" && (
                  <div className="text-2xs text-base-content/50">
                    {row.pre?.status === "SUBMITTED" ? `Pre ${row.pre.scorePercent}%` : "Pre not taken"}
                    {" · "}
                    {row.post?.status === "SUBMITTED" ? `Post ${row.post.scorePercent}%` : "Post not taken"}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge tone={st.tone} label={st.label} size="xs" />

                {audience === "tutor" && (
                  <>
                    <Link
                      href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test`}
                      className="btn btn-outline btn-xs text-2xs font-bold"
                    >
                      {row.test.status === "DRAFT" ? "Build" : "View"}
                    </Link>
                    {row.test.status !== "DRAFT" && (
                      <Link
                        href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test/results`}
                        className="btn btn-outline btn-primary btn-xs text-2xs font-bold"
                      >
                        Results
                      </Link>
                    )}
                  </>
                )}

                {audience === "learner" && <LearnerAction classId={classId} row={row} />}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
