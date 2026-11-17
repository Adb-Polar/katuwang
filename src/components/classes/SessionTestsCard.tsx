import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import PostPosttestButton from "@/components/tutor/PostPosttestButton";

export interface SessionTestRow {
  sessionId: string;
  topic: string;
  scheduledAt: string;
  test: { id: string; title: string; status: "DRAFT" | "PUBLISHED" | "CLOSED"; pretestClosedAt?: string | null; posttestOpenedAt?: string | null } | null;
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
  const canTakePost = row.test.status === "PUBLISHED" && row.sessionStatus !== "CANCELLED" && Boolean(row.test.posttestOpenedAt);

  // The single "next thing to do" action, if any.
  let primary: React.ReactNode = null;
  if (row.post?.status === "IN_PROGRESS") {
    primary = (
      <Link href={href("post")} className="btn btn-primary">
        Resume post-test
      </Link>
    );
  } else if (canTakePost && !postSubmitted) {
    primary = (
      <Link href={href("post")} className="btn btn-primary">
        Take post-test
      </Link>
    );
  } else if (row.pre?.status === "IN_PROGRESS") {
    primary = (
      <Link href={href("pre")} className="btn btn-primary">
        Resume pre-test
      </Link>
    );
  } else if (!row.pre && !row.post && row.test.status === "PUBLISHED" && row.sessionStatus === "SCHEDULED" && !row.test.pretestClosedAt && !row.test.posttestOpenedAt) {
    primary = (
      <Link href={href("pre")} className="btn btn-primary">
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
      <Link key="pre" href={href("pre")} className="btn btn-outline">
        Review pre
      </Link>,
    );
  }
  if (postSubmitted) {
    reviews.push(
      <Link key="post" href={href("post")} className="btn btn-outline">
        Review post
      </Link>,
    );
  }

  if (!primary && reviews.length === 0) {
    return <span className="text-sm text-(--kt-muted)">Not open yet</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
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
  tutorActionsEnabled = true,
}: {
  classId: string;
  audience: "tutor" | "learner";
  rows: SessionTestRow[];
  tutorActionsEnabled?: boolean;
}) {
  return (
    <section className="card kt-card">
      <div className="kt-card-body gap-1">
      <h2 className="font-serif text-xl font-medium">Session tests</h2>

      {rows.length === 0 ? (
        <p className="py-3 text-sm text-(--kt-muted)">
          No sessions yet.
        </p>
      ) : (
        rows.map((row) => {
          // Tutor, no test yet on this session.
          if (!row.test && audience === "tutor") {
            return (
              <div
                key={row.sessionId}
                className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-(--kt-border) last:border-b-0"
              >
                <span className="min-w-0 break-words"><span className="font-medium">{row.topic}</span> <span className="text-sm text-(--kt-muted)">· no test yet</span></span>
                <Link
                  href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test`}
                  className="btn btn-outline btn-primary shrink-0"
                >
                  Build test
                </Link>
              </div>
            );
          }

          if (!row.test) return null; // learner: nothing published for this session

          const st = STATUS_TONE[row.test.status];
          const statusLabel = row.test.status === "PUBLISHED"
            ? row.sessionStatus === "CANCELLED" ? "Session cancelled" : row.test.posttestOpenedAt ? "Post-test open" : row.test.pretestClosedAt || row.sessionStatus === "COMPLETED" ? "Pre-test closed" : "Pre-test open"
            : st.label;

          return (
            <div
              key={row.sessionId}
              className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-(--kt-border) last:border-b-0"
            >
              <div className="min-w-0 max-w-full">
                <div className="font-medium break-words">
                  {row.test.title.startsWith(row.topic) ? row.test.title : `${row.topic}: ${row.test.title}`}
                </div>
                {audience === "learner" && (
                  <div className="text-sm text-(--kt-muted)">
                    {row.pre?.status === "SUBMITTED" ? `Pre ${row.pre.scorePercent}%` : "Pre not taken"}
                    {" · "}
                    {row.post?.status === "SUBMITTED" ? `Post ${row.post.scorePercent}%` : "Post not taken"}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={st.tone} label={statusLabel} size="sm" />

                {audience === "tutor" && (
                  <>
                    {tutorActionsEnabled && row.test.status === "PUBLISHED" && row.sessionStatus !== "CANCELLED" && !row.test.posttestOpenedAt && (
                      <PostPosttestButton classId={classId} sessionId={row.sessionId} />
                    )}
                    <Link
                      href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test`}
                      className="btn btn-outline"
                    >
                      {row.test.status === "DRAFT" ? "Build" : "View"}
                    </Link>
                    {row.test.status !== "DRAFT" && (
                      <Link
                        href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test/results`}
                        className="btn btn-outline btn-primary"
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
    </section>
  );
}
