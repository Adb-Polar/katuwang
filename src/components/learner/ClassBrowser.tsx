"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { useState } from "react";
import { BROWSE_PAGE_SIZE } from "@/lib/pagination";


import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Tabs from "@/components/ui/Tabs";
import ClassCatalogCard from "@/components/classes/ClassCatalogCard";
import ClassEmptyState from "@/components/classes/ClassEmptyState";
import LoadingRow from "@/components/ui/LoadingRow";

type MineTab = "upcoming" | "completed" | "cancelled";
const MINE_TABS: { key: MineTab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = BROWSE_PAGE_SIZE;

interface ClassSession {
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

interface TutorClass {
  id: string;
  code: string;
  subject: string;
  gradeLevel: string | null;
  topics: string[];
  verifiedTopics: string[];
  description: string | null;
  sessions: ClassSession[];
  maxStudents: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  published: boolean;
  suspendedReason: string | null;
  tutor: { id: string; anonymousId: string; name?: string; section?: string; image?: string | null };
  _count: { enrollments: number };
}

/**
 * Renders one scope of the learner's class lists:
 *  - "browse" — enrollable classes the learner isn't in yet (`/learner/classes`)
 *  - "mine"   — the learner's enrolled classes (`/learner/my-classes`)
 *
 * Both scopes get a search/subject/grade filter bar; "mine" also gets
 * Upcoming / Completed / Cancelled status tabs. Page + page size live in the URL
 * via `usePaginatedList` so Back from a class detail restores the exact page.
 */
export default function ClassBrowser({ scope }: { scope: "browse" | "mine" }) {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [topic, setTopic] = useState("");
  const { subjects: catalog, topicsFor, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog(gradeLevel);
  const [mineTab, setMineTab] = useState<MineTab>("upcoming");

  const isBrowse = scope === "browse";
  const isMine = scope === "mine";

  const {
    data: classes,
    total,
    meta,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    refetch,
  } = usePaginatedList<TutorClass>(
    "/api/classes",
    "classes",
    {
      scope,
      ...(isMine ? { status: mineTab } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subject ? { subject } : {}),
      ...(topic ? { topic } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
    },
    PAGE_SIZE,
    "Could not retrieve classes.",
    scope
  );

  const mineTabCounts = (meta.counts as { mineTabs?: Record<MineTab, number> } | undefined)?.mineTabs;
  const hasFilters = q.trim() !== "" || subject !== "" || gradeLevel !== "" || topic !== "";

  return (
    <div className="space-y-6">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

            <FeedbackBanner variant="error" message={error || null} />

      <section className="flex flex-col gap-4">
        {isMine && (
          <Tabs
            tabs={MINE_TABS.map((t) => ({
              ...t,
              count: mineTabCounts?.[t.key],
            }))}
            active={mineTab}
            onChange={(key) => setMineTab(key as MineTab)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3">
          <SearchInput
            label="Search classes"
            value={q}
            onChange={setQ}
            placeholder={meta.showTutorRealNames === true
              ? "Search classes or tutors"
              : "Search classes"}
          />
          <select
            className="select select-bordered w-full"
            aria-label="Grade level"
            value={gradeLevel}
            onChange={(e) => { setGradeLevel(e.target.value); setSubject(""); setTopic(""); }}
          >
            <option value="">All grades</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered w-full"
            aria-label="Subject"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setTopic(""); }}
          >
            <option value="">All subjects</option>
            {catalog.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <select aria-label="Topic" className="select select-bordered w-full" value={topic}
            disabled={!subject} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All topics</option>
            {topicsFor(subject).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-error">
            <span>Classes could not be loaded.</span>
            <button type="button" onClick={refetch} className="btn btn-outline btn-error min-h-11">Retry loading classes</button>
          </div>
        ) : classes.length === 0 ? (
          <ClassEmptyState
            message={
              hasFilters
                ? "No classes match your filters."
                : isBrowse
                ? "No upcoming classes available right now."
                : mineTab === "completed"
                ? "No completed classes yet."
                : mineTab === "cancelled"
                ? "No cancelled classes."
                : "You haven't enrolled in any classes yet."
            }
            action={
              hasFilters ? (
                <button
                  onClick={() => {
                    setQ("");
                    setTopic("");
                    setSubject("");
                    setGradeLevel("");
                  }}
                  className="link text-primary"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="text-sm text-(--kt-muted)">
              {total} class{total === 1 ? "" : "es"}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {classes.map((c) => (
                <li key={c.id}>
                  <ClassCatalogCard
                    href={`/learner/classes/${c.id}?from=${isMine ? "my-classes" : "browse"}`}
                    subject={c.subject}
                    gradeLevel={c.gradeLevel}
                    topics={c.topics}
                    verifiedTopics={c.verifiedTopics}
                    sessions={c.sessions}
                    status={c.status}
                    enrolledCount={c._count.enrollments}
                    maxStudents={c.maxStudents}
                    tutorAnonymousId={c.tutor.anonymousId}
                    tutorName={c.tutor.name}
                    tutorSection={c.tutor.section}
                    showSeats={isBrowse}
                  />
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[12, 24, 48, 96]}
            />
          </>
        )}
      </section>
    </div>
  );
}
