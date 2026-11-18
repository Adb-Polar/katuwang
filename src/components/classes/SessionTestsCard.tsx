import Link from "next/link";
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

const rowClass = "flex flex-wrap items-center justify-between gap-3 py-4 border-b border-(--kt-border) last:border-b-0";

/** Where a session's test stands, as a coloured word for the row's status line. */
function testStatus(row: SessionTestRow): { label: string; className: string } {
  const test = row.test!;
  if (test.status === "DRAFT") return { label: "Draft", className: "text-base-content" };
  if (test.status === "CLOSED") return { label: "Closed", className: "text-base-content" };
  if (row.sessionStatus === "CANCELLED") return { label: "Session cancelled", className: "text-error" };
  if (test.posttestOpenedAt) return { label: "Post-test open", className: "text-success" };
  if (test.pretestClosedAt || row.sessionStatus === "COMPLETED") return { label: "Pre-test closed", className: "text-base-content" };
  return { label: "Pre-test open", className: "text-success" };
}

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
              <div key={row.sessionId} className={rowClass}>
                <div className="min-w-0">
                  <p className="font-medium break-words">{row.topic}</p>
                  <p className="text-sm text-(--kt-muted)">No test yet</p>
                </div>
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

          const status = testStatus(row);

          return (
            <div key={row.sessionId} className={rowClass}>
              <div className="min-w-0 max-w-full">
                <p className="font-medium break-words">
                  {row.test.title.startsWith(row.topic) ? row.test.title : `${row.topic}: ${row.test.title}`}
                </p>
                <p className="text-sm text-(--kt-muted)">
                  <span className={`font-medium ${status.className}`}>{status.label}</span>
                  {audience === "learner" && (
                    <>
                      {" · "}
                      {row.pre?.status === "SUBMITTED" ? `pre ${row.pre.scorePercent}%` : "pre not taken"}
                      {" · "}
                      {row.post?.status === "SUBMITTED" ? `post ${row.post.scorePercent}%` : "post not taken"}
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {audience === "tutor" && (
                  <>
                    {tutorActionsEnabled && row.test.status === "PUBLISHED" && row.sessionStatus !== "CANCELLED" && !row.test.posttestOpenedAt && (
                      <PostPosttestButton classId={classId} sessionId={row.sessionId} />
                    )}
                    {row.test.status === "DRAFT" ? (
                      <Link href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test`} className="btn btn-outline btn-primary">
                        Finish building
                      </Link>
                    ) : (
                      <>
                        <Link href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test`} className="btn btn-ghost">
                          View test
                        </Link>
                        <Link
                          href={`/tutor/classes/${classId}/sessions/${row.sessionId}/test/results`}
                          className="btn btn-outline btn-primary"
                        >
                          Results
                        </Link>
                      </>
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
