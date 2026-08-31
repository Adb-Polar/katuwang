"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import ClassCard from "@/components/classes/ClassCard";
import ClassEmptyState from "@/components/classes/ClassEmptyState";

const PAGE_SIZE = 12;
const SUBJECTS = Object.keys(SUBJECT_TOPICS) as SubjectArea[];

interface ClassSession {
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

interface TutorClass {
  id: string;
  code: string;
  subject: SubjectArea;
  gradeLevel: string | null;
  topics: string[];
  verifiedTopics: string[];
  description: string | null;
  sessions: ClassSession[];
  maxStudents: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  published: boolean;
  _count: { enrollments: number };
}

/**
 * Renders one scope of the learner's class lists:
 *  - "browse" — enrollable classes the learner isn't in yet (`/learner/classes`)
 *  - "mine"   — the learner's enrolled classes (`/learner/my-classes`)
 *
 * Page, page size and (browse only) the search/subject/grade filters live in the
 * URL via `usePaginatedList`, so a filtered view is shareable and pressing Back
 * from a class detail restores the exact page + filters the learner was on.
 */
export default function ClassBrowser({ scope }: { scope: "browse" | "mine" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<SubjectArea | "">("");
  const [gradeLevel, setGradeLevel] = useState("");

  const isBrowse = scope === "browse";

  const {
    data: classes,
    total,
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
      ...(isBrowse && q.trim() ? { q: q.trim() } : {}),
      ...(isBrowse && subject ? { subject } : {}),
      ...(isBrowse && gradeLevel ? { gradeLevel } : {}),
    },
    PAGE_SIZE,
    "Could not retrieve classes.",
    scope
  );

  const hasFilters = isBrowse && (q.trim() !== "" || subject !== "" || gradeLevel !== "");

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          {isBrowse && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="input input-bordered input-sm flex items-center gap-2 text-xs">
                <Search className="h-3.5 w-3.5 opacity-50" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Search code, subject, or topic..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <select
                className="select select-bordered select-sm text-xs"
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectArea | "")}
              >
                <option value="">All subjects</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
          )}

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : classes.length === 0 ? (
            <ClassEmptyState
              message={
                hasFilters
                  ? "No classes match your filters."
                  : scope === "browse"
                  ? "No upcoming classes available right now."
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
                    enrolledCount={c._count.enrollments}
                    maxStudents={c.maxStudents}
                    activeLabel="Open"
                    onClick={() => router.push(`/learner/classes/${c.id}`)}
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
