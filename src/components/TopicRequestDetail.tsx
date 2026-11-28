import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { gradeNumber } from "@/lib/gradeLevels";
import { REQUEST_STATUS_LABEL, changeLines, eventTitle, type RequestSnapshot } from "@/lib/requestHistoryText";
import { slotLabel } from "@/components/requests/requestSlots";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-0.5 py-3 border-b border-(--kt-border) last:border-b-0 sm:grid-cols-[9rem_1fr] sm:items-baseline">
      <dt className="text-sm text-(--kt-muted)">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

/** Who did it, as peers know each other: by anonymous ID, or "an administrator". */
function Actor({ user }: { user?: { anonymousId: string | null; role: string } }) {
  if (!user) return null;
  if (user.role === "ADMIN" || !user.anonymousId) return <> · by an administrator</>;
  const tone = user.role === "STUDENT_TUTOR" ? "kt-id--tutor" : "kt-id--learner";
  return <> · by <span className={`kt-id ${tone}`}>{user.anonymousId}</span></>;
}

/**
 * One class request and its history, shared by the learner, tutor and admin portals: what was asked
 * (topics, free times, note), where it stands, and each change in plain words.
 */
export default async function TopicRequestDetail({ id, back }: { id: string; back: string }) {
  const request = await prisma.topicRequest.findUniqueOrThrow({
    where: { id },
    include: { topics: true, slots: true, history: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  const now = new Date();
  const milestones = request.history.flatMap((entry, index) => {
    const after = entry.after as { expiresAt?: string; status?: string };
    const next = request.history[index + 1];
    const expiresAt = after?.expiresAt ? new Date(after.expiresAt) : null;
    return expiresAt && after.status === "OPEN" && expiresAt <= now && (!next || expiresAt < next.createdAt)
      ? [{ id: `expiry-${entry.id}`, eventType: "EXPIRED", createdAt: expiresAt, actorId: null, before: null, after: null }]
      : [];
  });
  const timeline = [...request.history, ...milestones].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const actorIds = [...new Set(timeline.map((e) => e.actorId).filter((x): x is string => Boolean(x)))];
  const actors = new Map(
    (await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, anonymousId: true, role: true } }))
      .map((u) => [u.id, u]),
  );

  const isExpired = request.status === "OPEN" && request.expiresAt <= now;
  const status = isExpired ? "EXPIRED" : request.status;
  const [firstTopic, ...otherTopics] = request.topics.map((t) => t.topic);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <BackLink href={back}>Back to requests</BackLink>
        <PageHeader
          eyebrow="Class request"
          title={firstTopic ?? subjectDisplayLabel(request.subject)}
          subtitle={`${subjectDisplayLabel(request.subject)} · Grade ${gradeNumber(request.gradeLevel)}`}
        />
      </div>

      {/* Wide screens: the request on the left, its history beside it. */}
      <div className="grid gap-8 items-start xl:grid-cols-2">
      <section className="card kt-card" aria-labelledby="request-details">
        <div className="kt-card-body gap-2">
          <h2 id="request-details" className="font-serif text-2xl font-medium leading-tight">What was asked</h2>
          <dl>
            <Row label="Status">
              <span className={status === "ACCEPTED" || status === "ENROLLED" ? "text-success font-medium" : "font-medium"}>
                {REQUEST_STATUS_LABEL[status] ?? status}
              </span>
            </Row>
            {otherTopics.length > 0 && (
              <Row label="Topics">
                <ul className="space-y-1">
                  {[firstTopic, ...otherTopics].map((t) => <li key={t}>{t}</li>)}
                </ul>
              </Row>
            )}
            <Row label="Free times">
              {request.slots.length > 0 ? (
                <ul className="space-y-1">
                  {request.slots.map((s) => <li key={s.id}>{slotLabel(s)}</li>)}
                </ul>
              ) : (
                <span className="text-(--kt-muted)">Any time</span>
              )}
            </Row>
            {request.note && <Row label="Note">{request.note}</Row>}
            <Row label="Posted">{formatDateTime(request.lastSubmittedAt)}</Row>
            <Row label={isExpired ? "Closed" : "Open until"}>{formatDateTime(request.expiresAt)}</Row>
          </dl>
        </div>
      </section>

      <section className="card kt-card" aria-labelledby="request-history">
        <div className="kt-card-body gap-4">
          <h2 id="request-history" className="font-serif text-2xl font-medium leading-tight">History</h2>
          <ol className="border-l border-(--kt-border)">
            {timeline.map((event) => {
              const changes = changeLines(event.before as RequestSnapshot | null, event.after as RequestSnapshot | null);
              return (
                <li key={event.id} className="relative pl-5 pb-5 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[5px] top-1.5 size-[9px] rounded-full border-2 border-primary bg-base-100" />
                  <p className="font-medium">{eventTitle(event.eventType, event.after as RequestSnapshot | null)}</p>
                  <p className="text-sm text-(--kt-muted)">
                    {formatDateTime(event.createdAt)}
                    <Actor user={event.actorId ? actors.get(event.actorId) : undefined} />
                  </p>
                  {changes.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {changes.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      </div>
    </div>
  );
}
