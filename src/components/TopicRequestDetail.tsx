import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/datetime";

export default async function TopicRequestDetail({ id, back }: { id: string; back: string }) {
  const request = await prisma.topicRequest.findUniqueOrThrow({
    where: { id },
    include: { topics: true, slots: true, history: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  const milestones = request.history.flatMap((entry, index) => {
    const after = entry.after as { expiresAt?: string; status?: string };
    const next = request.history[index + 1];
    const expiresAt = after?.expiresAt ? new Date(after.expiresAt) : null;
    return expiresAt && after.status === "OPEN" && expiresAt <= new Date() && (!next || expiresAt < next.createdAt)
      ? [{ id: `expiry-${entry.id}`, eventType: "EXPIRED", createdAt: expiresAt, actorId: null, before: null, after: null }]
      : [];
  });
  const timeline = [...request.history, ...milestones].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return <div className="space-y-6">
    <Link href={back} className="link link-primary text-sm">← Back to requests</Link>
    <section className="card kt-card"><div className="card-body">
      <h1 className="card-title">{request.subject} request</h1>
      <p className="text-sm">Status: {request.status === "OPEN" && request.expiresAt <= new Date() ? "Expired" : request.status}</p>
      <p className="text-sm">Topics: {request.topics.map((t) => t.topic).join(", ")}</p>
      {request.note && <p className="text-sm">Note: {request.note}</p>}
      <p className="text-sm">Preferred times: {request.slots.map((s) => `${s.day} ${s.startTime}–${s.endTime}`).join(", ") || "None"}</p>
      <p className="text-xs">Submitted {formatDateTime(request.lastSubmittedAt)} · Deadline {formatDateTime(request.expiresAt)}</p>
    </div></section>
    <section className="card kt-card"><div className="card-body"><h2 className="card-title">History</h2>
      <ol className="space-y-3">{timeline.map((event) => <li key={event.id} className="border-l-2 border-primary pl-3 text-sm">
        <strong>{event.eventType === "IMPORTED_BASELINE" ? "Imported baseline (earlier edits unavailable)" : event.eventType.replaceAll("_", " ")}</strong>
        <span className="block text-xs opacity-60">{formatDateTime(event.createdAt)}{event.actorId ? ` · ${event.actorId}` : ""}</span>
        {event.before && <details className="text-xs"><summary>Changes</summary><pre className="whitespace-pre-wrap">{JSON.stringify({ before: event.before, after: event.after }, null, 2)}</pre></details>}
      </li>)}</ol>
    </div></section>
  </div>;
}
