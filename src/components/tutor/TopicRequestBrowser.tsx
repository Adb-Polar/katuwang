"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { useState, type ReactNode } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";
import Tabs from "@/components/ui/Tabs";
import { formatDateTime, formatDayMonth } from "@/lib/datetime";
import { gradeNumber } from "@/lib/gradeLevels";
import { SlotDate, slotRange } from "@/components/requests/requestSlots";
import LoadErrorState from "@/components/ui/LoadErrorState";
import { subjectDisplayLabel } from "@/lib/displayLabels";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface OpenRequest {
  id: string;
  subject: string;
  gradeLevel: string;
  note: string | null;
  createdAt: string;
  topics: string[];
  slots: { date?: string | null; day: string; startTime: string; endTime: string }[];
  learner: { anonymousId: string; image?: string | null; gradeLevel: string; section: string };
  directed: boolean;
}

interface AcceptedRequest {
  id: string;
  subject: string;
  gradeLevel: string;
  status: "ACCEPTED" | "ENROLLED";
  topics: string[];
  learner: { anonymousId: string; image?: string | null; gradeLevel: string; section: string };
  class: { id: string; nextSessionAt: string | null; enrolledCount: number; maxStudents: number } | null;
}

export default function TopicRequestBrowser() {
  const { subjects, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog();
  const [tab, setTab] = useState<"directed" | "public" | "accepted">("directed");
  const [subject, setSubject] = useState<string>("");

  const directedList = usePaginatedList<OpenRequest>(
    "/api/tutor/topic-requests",
    "requests",
    { tab: "directed", ...(subject ? { subject } : {}) },
    PAGE_SIZE,
    "Could not load directed requests.",
    "directed"
  );

  const publicList = usePaginatedList<OpenRequest>(
    "/api/tutor/topic-requests",
    "requests",
    { tab: "public", ...(subject ? { subject } : {}) },
    PAGE_SIZE,
    "Could not load public requests.",
    "public"
  );

  const acceptedList = usePaginatedList<AcceptedRequest>(
    "/api/tutor/topic-requests",
    "requests",
    { tab: "accepted", ...(subject ? { subject } : {}) },
    PAGE_SIZE,
    "Could not load accepted requests.",
    "accepted"
  );

  const openList = tab === "directed" ? directedList : publicList;
  const active = tab === "accepted" ? acceptedList : openList;
  const isOpenTab = tab === "directed" || tab === "public";

  return (
    <div className="space-y-5">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <Tabs
        tabs={[
          { key: "directed", label: "Sent to you", count: directedList.total },
          { key: "public", label: "Public", count: publicList.total },
          { key: "accepted", label: "Accepted by you", count: acceptedList.total },
        ]}
        active={tab}
        onChange={(k) => setTab(k as "directed" | "public" | "accepted")}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-(--kt-muted) max-w-xl">
          {tab === "directed" && "Learners sent these requests to you. "}
          {tab === "public" && "Open requests that include a topic you're certified in. "}
          {tab === "accepted" && "Requests you turned into a class. "}
          {isOpenTab && (
            <>
              To accept one you need to be certified in every topic it asks for —{" "}
              <Link href="/tutor/profile" className="link text-primary">see your topics</Link>.
            </>
          )}
        </p>
        <div className="sm:w-60 shrink-0">
          <FormField size="md" label="Subject">
            <select className="select select-bordered w-full" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {active.loading ? (
        <p role="status" className="text-(--kt-muted)">Loading requests…</p>
      ) : active.loadError ? (
        <LoadErrorState message={active.loadError} onRetry={active.refetch} />
      ) : active.data.length === 0 ? (
        <p className="kt-card px-5 py-6">
          {tab === "directed"
            ? "No open requests were sent to you."
            : tab === "public"
            ? "No public requests match your topics right now."
            : "You haven't accepted any requests yet."}
        </p>
      ) : (
        <ul className="kt-card">
          {isOpenTab
            ? openList.data.map((r) => <OpenRequestRow key={r.id} request={r} />)
            : acceptedList.data.map((r) => <AcceptedRequestRow key={r.id} request={r} />)}
        </ul>
      )}

      <Pagination page={active.page} pageSize={PAGE_SIZE} total={active.total} onPageChange={active.setPage} />
    </div>
  );
}

const rowClass = "flex gap-4 px-5 py-4 border-b border-(--kt-border) last:border-b-0";

/** Short labelled rows (When / From / Class) so the facts group apart from the title and the note. */
function Facts({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-(--kt-muted)">{label}</dt>
          <dd className="min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const muted = (text: ReactNode) => <span className="text-(--kt-muted)">{text}</span>;

/** Subject · grade above, the first topic as the serif title (links to the request's history), other topics under it. */
function RequestHeading({ id, subject, gradeLevel, topics }: { id: string; subject: string; gradeLevel: string; topics: string[] }) {
  const [first, ...rest] = topics;
  return (
    <div>
      <p className="text-sm text-(--kt-muted)">
        {subjectDisplayLabel(subject)} · Grade {gradeNumber(gradeLevel)}
      </p>
      <h3 className="font-serif text-xl font-medium leading-snug break-words">
        <Link href={`/tutor/requests/${id}`} className="link link-hover">{first}</Link>
      </h3>
      {rest.map((t) => (
        <p key={t} className="leading-snug break-words">{t}</p>
      ))}
    </div>
  );
}

const learnerId = (learner: OpenRequest["learner"]) => (
  <span className="kt-id kt-id--learner">{learner.anonymousId}</span>
);

/** "Wed 3:00–4:00 PM" / "Dec 11 3:00–4:00 PM" — the other times a learner is free, short enough for one line. */
function shortSlot(slot: OpenRequest["slots"][number]): string {
  const day = slot.date
    ? new Date(`${slot.date}T12:00:00+08:00`).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric" })
    : `every ${slot.day[0]}${slot.day.slice(1, 3).toLowerCase()}`;
  return `${day} ${slotRange(slot)}`;
}

function OpenRequestRow({ request: r }: { request: OpenRequest }) {
  const [first, ...more] = r.slots;
  return (
    <li className={rowClass}>
      <SlotDate slot={first} />
      <div className="min-w-0 flex-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-3">
          <RequestHeading id={r.id} subject={r.subject} gradeLevel={r.gradeLevel} topics={r.topics} />
          <Facts
            rows={[
              // With no free times the date block already says "Any time".
              ...(first
                ? [[
                    "When",
                    <>
                      <span className="font-medium">{slotRange(first)}</span>
                      {more.length > 0 && muted(`, or ${more.map(shortSlot).join(", or ")}`)}
                    </>,
                  ] as [string, ReactNode]]
                : []),
              ["From", <>{learnerId(r.learner)} {muted(`· asked ${formatDayMonth(r.createdAt)}`)}</>],
            ]}
          />
          {r.note && (
            <p className="text-sm max-w-prose rounded-field bg-base-200/70 px-3 py-2">&ldquo;{r.note}&rdquo;</p>
          )}
        </div>
        <Link href={`/tutor/requests/${r.id}/accept`} className="btn btn-primary shrink-0 self-start">
          Accept &amp; create class
        </Link>
      </div>
    </li>
  );
}

function AcceptedRequestRow({ request: r }: { request: AcceptedRequest }) {
  return (
    <li className={rowClass}>
      <div className="min-w-0 flex-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-3">
          <RequestHeading id={r.id} subject={r.subject} gradeLevel={r.gradeLevel} topics={r.topics} />
          <Facts
            rows={[
              ["From", learnerId(r.learner)],
              ...(r.class
                ? [[
                    "Class",
                    <>
                      {r.class.enrolledCount} of {r.class.maxStudents} enrolled
                      {r.class.nextSessionAt && muted(` · first session ${formatDateTime(r.class.nextSessionAt)}`)}
                    </>,
                  ] as [string, ReactNode]]
                : []),
            ]}
          />
          <p className={`text-sm font-medium ${r.status === "ENROLLED" ? "text-success" : ""}`}>
            {r.status === "ENROLLED" ? "The learner enrolled." : "Waiting for the learner to enroll."}
          </p>
        </div>
        {r.class && (
          <Link href={`/tutor/classes/${r.class.id}`} className="btn btn-ghost shrink-0 self-start">View class</Link>
        )}
      </div>
    </li>
  );
}
