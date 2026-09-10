"use client";

import { useState } from "react";
import { BROWSE_PAGE_SIZE } from "@/lib/pagination";
import { useRouter } from "next/navigation";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Tabs from "@/components/ui/Tabs";
import ClassCard from "@/components/classes/ClassCard";
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
  tutor: { id: string; anonymousId: string; name?: string; section?: string };
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
  const router = useRouter();
  const [q, setQ] = useState("");
  const { subjects: catalog } = useSubjectCatalog();
  const [subject, setSubject] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState("");
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
  } = usePaginatedList<TutorClass>(
    "/api/classes",
    "classes",
    {
      scope,
      ...(isMine ? { status: mineTab } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subject ? { subject } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
    },
    PAGE_SIZE,
    "Could not retrieve classes.",
    scope
  );

  const mineTabCounts = (meta.counts as { mineTabs?: Record<MineTab, number> } | undefined)?.mineTabs;
  const hasFilters = q.trim() !== "" || subject !== "" || gradeLevel !== "";

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search code, subject, or topic..."
            />
            <select
              className="select select-bordered select-sm text-xs"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">All subjects</option>
              {catalog.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="select select-bordered select-sm text-xs"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
            >
              <option value="">All grades</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingRow />
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
                      setSubject("");
                      setGradeLevel("");
                    }}
                    className="btn btn-link btn-xs text-primary mt-1 text-xs"
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <p className="text-xs text-base-content/50">
                {total} class{total === 1 ? "" : "es"}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {classes.map((c) => (
                  <ClassCard
                    key={c.id}
                    code={c.code}
                    subject={c.subject}
                    gradeLevel={c.gradeLevel}
                    topics={c.topics}
                    verifiedTopics={c.verifiedTopics}
                    description={c.description}
                    sessions={c.sessions}
                    status={c.status}
                    published={c.published}
                    suspendedReason={c.suspendedReason}
                    enrolledCount={c._count.enrollments}
                    maxStudents={c.maxStudents}
                    activeLabel="Open"
                    tutorAnonymousId={c.tutor.anonymousId}
                    tutorName={c.tutor.name}
                    tutorSection={c.tutor.section}
                    onClick={() =>
                      router.push(`/learner/classes/${c.id}?from=${isMine ? "my-classes" : "browse"}`)
                    }
                  />
                ))}
              </div>
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
        </div>
      </section>
    </div>
  );
}
