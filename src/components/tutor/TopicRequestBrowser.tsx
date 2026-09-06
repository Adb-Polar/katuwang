"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";

const PAGE_SIZE = 10;

interface OpenRequest {
  id: string;
  subject: string;
  gradeLevel: string;
  note: string | null;
  createdAt: string;
  topics: string[];
  slots: { day: string; startTime: string; endTime: string }[];
  learner: { anonymousId: string; gradeLevel: string; section: string };
  directed: boolean;
}

interface AcceptedRequest {
  id: string;
  subject: string;
  gradeLevel: string;
  status: "ACCEPTED" | "ENROLLED";
  topics: string[];
  learner: { anonymousId: string; gradeLevel: string; section: string };
  class: { id: string; nextSessionAt: string | null; enrolledCount: number; maxStudents: number } | null;
}

export default function TopicRequestBrowser() {
  const { subjects } = useSubjectCatalog();
  const [tab, setTab] = useState<"open" | "accepted">("open");
  const [subject, setSubject] = useState<string>("");

  const openList = usePaginatedList<OpenRequest>(
    "/api/tutor/topic-requests",
    "requests",
    { tab: "open", ...(subject ? { subject } : {}) },
    PAGE_SIZE,
    "Could not load topic requests.",
    "open"
  );

  const acceptedList = usePaginatedList<AcceptedRequest>(
    "/api/tutor/topic-requests",
    "requests",
    { tab: "accepted", ...(subject ? { subject } : {}) },
    PAGE_SIZE,
    "Could not load accepted requests.",
    "accepted"
  );

  const active = tab === "open" ? openList : acceptedList;

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={active.error || null} />

      <Tabs
        tabs={[
          { key: "open", label: "Open to me" },
          { key: "accepted", label: "Accepted by me" },
        ]}
        active={tab}
        onChange={(k) => setTab(k as "open" | "accepted")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Subject">
          <select
            className="select select-bordered select-sm text-xs"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {active.loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : tab === "open" ? (
        openList.data.length === 0 ? (
          <div className="text-center py-10 bg-base-200/10 border border-dashed border-base-300 rounded-xl text-base-content/40 italic text-xs">
            No open requests match these filters.
          </div>
        ) : (
          <div className="space-y-3">
            {openList.data.map((r) => (
              <div
                key={r.id}
                className={`border rounded-xl p-4 space-y-2 text-xs ${
                  r.directed ? "border-primary/40 bg-primary/5" : "border-base-300 bg-base-200/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-neutral text-2xs font-bold uppercase tracking-wide px-2 py-2">
                      {r.subject}
                    </span>
                    {r.directed && <StatusBadge tone="info" label="Directed to you" size="xs" />}
                    <AnonymousIdBadge id={r.learner.anonymousId} role="LEARNER" />
                    <span className="text-base-content/50">
                      {r.learner.gradeLevel.replace("_", " ")} · {r.learner.section}
                    </span>
                  </div>
                  <Link
                    href={`/tutor/requests/${r.id}/accept`}
                    className="btn btn-primary btn-xs text-2xs"
                  >
                    Accept &amp; create class
                  </Link>
                </div>

                <div className="flex flex-wrap gap-1">
                  {r.topics.map((t) => (
                    <span key={t} className="badge badge-outline badge-sm text-2xs py-2.5">
                      {t}
                    </span>
                  ))}
                </div>

                {r.slots.length > 0 && (
                  <p className="text-2xs text-base-content/60">
                    Prefers:{" "}
                    {r.slots
                      .map((s) => `${s.day[0] + s.day.slice(1).toLowerCase()} ${s.startTime}–${s.endTime}`)
                      .join(", ")}
                  </p>
                )}

                {r.note && <p className="text-base-content/60 italic">“{r.note}”</p>}

                <p className="text-2xs text-base-content/40">
                  Requested {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )
      ) : acceptedList.data.length === 0 ? (
        <div className="text-center py-10 bg-base-200/10 border border-dashed border-base-300 rounded-xl text-base-content/40 italic text-xs">
          You haven&apos;t accepted any requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {acceptedList.data.map((r) => (
            <div key={r.id} className="border border-base-300 bg-base-200/50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-neutral text-2xs font-bold uppercase tracking-wide px-2 py-2">
                    {r.subject}
                  </span>
                  <AnonymousIdBadge id={r.learner.anonymousId} role="LEARNER" />
                  <StatusBadge
                    tone={r.status === "ENROLLED" ? "success" : "info"}
                    label={r.status === "ENROLLED" ? "Enrolled" : "Awaiting enrollment"}
                    size="xs"
                  />
                </div>
                {r.class && (
                  <Link href={`/tutor/classes/${r.class.id}`} className="btn btn-ghost btn-xs text-2xs">
                    View class
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {r.topics.map((t) => (
                  <span key={t} className="badge badge-outline badge-sm text-2xs py-2.5">
                    {t}
                  </span>
                ))}
              </div>

              {r.class && (
                <p className="text-2xs text-base-content/60">
                  {r.class.enrolledCount}/{r.class.maxStudents} enrolled
                  {r.class.nextSessionAt
                    ? ` · next ${new Date(r.class.nextSessionAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination page={active.page} pageSize={PAGE_SIZE} total={active.total} onPageChange={active.setPage} />
    </div>
  );
}
