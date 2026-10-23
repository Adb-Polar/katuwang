"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { BROWSE_PAGE_SIZE } from "@/lib/pagination";


import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import type { GradeLevel } from "@prisma/client";
import { GRADE_LEVELS, getEligibleClassTargetGradesForStudent } from "@/lib/gradeLevels";
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
  const { subjects: catalog } = useSubjectCatalog();
  const [subject, setSubject] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [mineTab, setMineTab] = useState<MineTab>("upcoming");

  const isBrowse = scope === "browse";
  const isMine = scope === "mine";

  const { data: sessionData } = useSession();
  const learnerGrade = sessionData?.user?.gradeLevel;
  const eligibleGradeLevels = learnerGrade
    ? getEligibleClassTargetGradesForStudent(learnerGrade)
    : null;
  const displayedGradeLevels = eligibleGradeLevels
    ? GRADE_LEVELS.filter((g) => eligibleGradeLevels.includes(g.value as GradeLevel))
    : GRADE_LEVELS;

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
              label="Search classes"
              value={q}
              onChange={setQ}
              placeholder="Search code, subject, or topic..."
            />
            <select
              aria-label="Filter classes by subject"
              className="select select-bordered select-sm text-base min-h-11 sm:text-sm"
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
              aria-label="Filter classes by grade"
              className="select select-bordered select-sm text-base min-h-11 sm:text-sm"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
            >
              <option value="">All grades</option>
              {displayedGradeLevels.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
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
                    tutorImage={c.tutor.image}
                    href={`/learner/classes/${c.id}?from=${isMine ? "my-classes" : "browse"}`}
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
