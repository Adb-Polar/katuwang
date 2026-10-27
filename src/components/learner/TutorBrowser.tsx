"use client";

import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { useState } from "react";
import { BROWSE_PAGE_SIZE } from "@/lib/pagination";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarClock, GraduationCap } from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import { formatDayMonth, formatTime, formatWeekday } from "@/lib/datetime";

const PAGE_SIZE = BROWSE_PAGE_SIZE;

interface TutorRow {
  id: string;
  anonymousId: string;
  name?: string;
  section?: string;
  verifiedTopicCount: number;
  subjects: string[];
  verifiedClasses: { code: string; subject: string }[];
  publishedClassCount: number;
  nextSessionAt: string | null;
}

function fmtNext(iso: string) {
  return `${formatWeekday(iso)}, ${formatDayMonth(iso)} · ${formatTime(iso)}`;
}

export default function TutorBrowser() {
  const router = useRouter();
  const [gradeLevel, setGradeLevel] = useState("");
  const { subjects: catalog } = useSubjectCatalog(gradeLevel);
  const [q, setQ] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  const toggleSubject = (slug: string) =>
    setSubjects((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const {
    data: tutors,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
  } = usePaginatedList<TutorRow>(
    "/api/learner/tutors",
    "tutors",
    {
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subjects.length ? { subjects: [...subjects].sort().join(",") } : {}),
    },
    PAGE_SIZE,
    "Could not load tutors.",
    "tutors"
  );

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="space-y-2.5">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search a tutor by ID (e.g. TUT-0148)…"
              transform="upper"
            />
            <div className="flex flex-wrap items-start gap-3">
              <select aria-label="Grade level" className="select select-bordered select-sm" value={gradeLevel}
                onChange={(e) => { setGradeLevel(e.target.value); setSubjects([]); }}>
                <option value="">All grades</option>
                {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <details className="dropdown">
                <summary className="btn btn-outline btn-sm">Teaches{subjects.length ? ` (${subjects.length})` : ""}</summary>
                <div className="dropdown-content z-20 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg w-64 max-h-64 overflow-y-auto">
                  {catalog.map((s) => <label key={s.slug} className="flex items-center gap-2 py-1.5 text-xs">
                    <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={subjects.includes(s.slug)}
                      onChange={() => toggleSubject(s.slug)} />{s.name}
                  </label>)}
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSubjects([])}>Clear</button>
                </div>
              </details>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : tutors.length === 0 ? (
            <p className="rounded-xl border border-dashed border-base-300 py-10 text-center text-xs italic text-base-content/40">
              No verified tutors match this filter yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => router.push(`/learner/tutors/${t.id}`)}
                  className="flex flex-col gap-2.5 rounded-xl border border-base-300 bg-base-200/40 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-base-100 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <AnonymousIdBadge id={t.anonymousId} role="TUTOR" size="sm" showIcon />
                    {t.name && (
                      <span className="truncate text-2xs text-base-content/50">{t.name}</span>
                    )}
                  </div>

                  {t.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map((s) => (
                        <span key={s} className="badge badge-neutral badge-sm text-2xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {t.verifiedClasses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-2xs text-base-content/45">Verified classes</span>
                      {t.verifiedClasses.map((c) => (
                        <span
                          key={c.code}
                          className="badge badge-success badge-sm gap-1 text-2xs"
                          title={`${c.subject} · ${c.code}`}
                        >
                          <BadgeCheck className="h-2.5 w-2.5" />
                          {c.code}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto grid grid-cols-2 gap-2 border-t border-base-300 pt-2 text-2xs text-base-content/60">
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3 text-success" />
                      {t.verifiedTopicCount} verified {t.verifiedTopicCount === 1 ? "topic" : "topics"}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-primary" />
                      {t.publishedClassCount} {t.publishedClassCount === 1 ? "class" : "classes"}
                    </span>
                    {t.nextSessionAt && (
                      <span className="col-span-2 flex items-center gap-1">
                        <CalendarClock className="h-3 w-3 text-base-content/40" />
                        Next session {fmtNext(t.nextSessionAt)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </section>
    </div>
  );
}
