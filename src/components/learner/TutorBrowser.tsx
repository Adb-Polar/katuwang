"use client";

import { useState } from "react";
import { BROWSE_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";
import { BadgeCheck, CalendarClock, GraduationCap } from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import LoadErrorState from "@/components/ui/LoadErrorState";
import Pagination from "@/components/ui/Pagination";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import { formatDayMonth, formatTime, formatWeekday } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";

import UserAvatar from "@/components/profile/UserAvatar";

const PAGE_SIZE = BROWSE_PAGE_SIZE;

interface TutorRow {
  id: string;
  anonymousId: string;
  image?: string | null;
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
  const { subjects: catalog } = useSubjectCatalog();
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
    loadError,
    refetch,
  } = usePaginatedList<TutorRow>(
    "/api/learner/tutors",
    "tutors",
    {
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subjects.length ? { subjects: [...subjects].sort().join(",") } : {}),
    },
    PAGE_SIZE,
    "Could not load tutors.",
    "tutors"
  );

  return (
    <div className="space-y-6">

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="space-y-2.5">
            <SearchInput
              label="Search tutors"
              value={q}
              onChange={setQ}
              placeholder="Search a tutor by ID (e.g. TUT-0148)…"
              transform="upper"
            />
            <div role="group" aria-label="Filter tutors by subject taught" className="flex flex-wrap items-center gap-1.5">
              <span className="text-2xs font-semibold uppercase tracking-wide text-base-content/40">
                Teaches
              </span>
              {catalog.map((s) => {
                const on = subjects.includes(s.slug);
                return (
                  <button
                    key={s.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSubject(s.slug)}
                    className={`badge badge-sm cursor-pointer text-2xs transition-colors ${
                      on ? "badge-primary" : "badge-ghost hover:badge-neutral"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
              {subjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSubjects([])}
                  className="text-2xs text-base-content/50 underline hover:text-base-content"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : tutors.length === 0 ? (
            <p className="rounded-xl border border-dashed border-base-300 py-10 text-center text-xs italic text-base-content/40">
              No verified tutors match this filter yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((t) => (
                <Link
                  key={t.id}
                  href={`/learner/tutors/${t.id}`}
                  className="flex flex-col gap-2.5 rounded-xl border border-base-300 bg-base-200/40 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-base-100 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        src={t.image}
                        name={t.name}
                        anonymousId={t.anonymousId}
                        size="sm"
                        role="TUTOR"
                        subtitle={t.subjects.length > 0 ? t.subjects.map(subjectDisplayLabel).join(", ") : undefined}
                      />
                      <div className="min-w-0">
                        <AnonymousIdBadge id={t.anonymousId} role="TUTOR" size="sm" showIcon />
                        {t.name && (
                          <span className="block truncate text-2xs text-base-content/50 mt-0.5">{t.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {t.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map((s) => (
                        <span key={s} className="badge badge-neutral badge-sm text-2xs">
                          {subjectDisplayLabel(s)}
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
                          title={`${subjectDisplayLabel(c.subject)} · ${c.code}`}
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
                </Link>
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
