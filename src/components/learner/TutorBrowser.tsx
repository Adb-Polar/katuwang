"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { useEffect, useRef, useState } from "react";
import { BROWSE_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";
import { BadgeCheck, CalendarClock, GraduationCap } from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import LoadErrorState from "@/components/ui/LoadErrorState";
import Pagination from "@/components/ui/Pagination";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import TopicChip from "@/components/ui/TopicChip";
import { formatDayMonth, formatTime, formatWeekday } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";

import UserAvatar from "@/components/profile/UserAvatar";

const PAGE_SIZE = BROWSE_PAGE_SIZE;
const MAX_VISIBLE_SUBJECTS = 2;
const MAX_VISIBLE_CLASSES = 3;
const MAX_VISIBLE_TOPICS = 3;
const SUBJECT_GROUPS = [
  { label: "STEM", slugs: ["MATH", "SCIENCE", "RESEARCH_DIGITAL_LITERACY"] },
  { label: "Humanities & social sciences", slugs: ["ENGLISH", "FILIPINO", "ARALING_PANLIPUNAN", "VALUES_EDUCATION"] },
  { label: "Business", slugs: ["BUSINESS_ENTREPRENEURSHIP"] },
  { label: "Arts, health & other", slugs: ["MAPEH", "MISCELLANEOUS"] },
];

interface TutorRow {
  id: string;
  anonymousId: string;
  image?: string | null;
  name?: string;
  section?: string;
  verifiedTopicCount: number;
  verifiedTopics: { subject: string; topic: string }[];
  subjects: string[];
  verifiedClasses: { code: string; subject: string }[];
  publishedClassCount: number;
  nextSessionAt: string | null;
}

function fmtNext(iso: string) {
  return `${formatWeekday(iso)}, ${formatDayMonth(iso)} · ${formatTime(iso)}`;
}

export default function TutorBrowser() {
  const subjectMenuRef = useRef<HTMLDetailsElement>(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const { subjects: catalog, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog(gradeLevel);
  const [q, setQ] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [sort, setSort] = useState("codeAsc");
  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!subjectMenuRef.current?.contains(event.target as Node)) subjectMenuRef.current?.removeAttribute("open");
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") subjectMenuRef.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  const subjectGroups = SUBJECT_GROUPS.map((group) => ({
    label: group.label,
    items: catalog.filter((subject) => group.slugs.includes(subject.slug)),
  }));
  const otherSubjects = catalog.filter((subject) => !SUBJECT_GROUPS.some((group) => group.slugs.includes(subject.slug)));
  if (otherSubjects.length) subjectGroups.push({ label: "Other subjects", items: otherSubjects });

  const toggleSubject = (slug: string) =>

          setSubjects((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const {
    data: tutors,
    meta,
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
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subjects.length ? { subjects: [...subjects].sort().join(",") } : {}),
      sort,
    },
    PAGE_SIZE,
    "Could not load tutors.",
    "tutors"
  );

  return (
    <div className="space-y-6">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="space-y-2.5">
            <SearchInput
              label="Search tutors"
              value={q}
              onChange={setQ}
              placeholder={meta.showTutorRealNames === true
                ? "Search by tutor name or ID…"
                : "Search a tutor by ID (e.g. TUT-0148)…"}
            />
            <div className="flex flex-wrap items-start gap-3">
              <select aria-label="Grade level" className="select select-bordered select-sm" value={gradeLevel}
                onFocus={() => subjectMenuRef.current?.removeAttribute("open")}
                onChange={(e) => { setGradeLevel(e.target.value); setSubjects([]); }}>
                <option value="">All grades</option>
                {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <details ref={subjectMenuRef} className="dropdown">
                <summary className="btn btn-outline btn-sm">Teaches{subjects.length ? ` (${subjects.length})` : ""}</summary>
                <div className="dropdown-content z-20 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg w-64 max-h-64 overflow-y-auto">
                  {subjectGroups.filter((group) => group.items.length).map((group) => (
                    <fieldset key={group.label} className="mb-2 border-b border-base-200 pb-2 last:border-0">
                      <legend className="text-2xs font-semibold uppercase tracking-wide text-(--kt-faint)">{group.label}</legend>
                      {group.items.map((s) => <label key={s.slug} className="flex items-center gap-2 py-1.5 text-xs">
                        <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={subjects.includes(s.slug)}
                          onChange={() => toggleSubject(s.slug)} />{s.name}
                      </label>)}
                    </fieldset>
                  ))}
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSubjects([])}>Clear</button>
                </div>
              </details>
              <select aria-label="Sort matching tutors" className="select select-bordered select-sm" value={sort}
                onFocus={() => subjectMenuRef.current?.removeAttribute("open")}
                onChange={(e) => setSort(e.target.value)}>
                <option value="codeAsc">Tutor ID: A–Z</option>
                <option value="codeDesc">Tutor ID: Z–A</option>
                <option value="newest">Newest tutors</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : tutors.length === 0 ? (
            <p className="rounded-xl border border-dashed border-base-300 py-10 text-center text-xs italic text-(--kt-faint)">
              No verified tutors match this filter yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((t) => (
                <Link
                  key={t.id}
                  href={`/learner/tutors/${t.id}`}
                  className="flex min-h-64 min-w-0 flex-col gap-2.5 overflow-hidden rounded-xl border border-base-300 bg-base-200/40 p-4 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-base-100"
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
                          <span className="block truncate text-2xs text-(--kt-faint) mt-0.5">{t.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {t.subjects.length > 0 && (
                    <div className="flex min-h-5 min-w-0 items-center gap-1 overflow-hidden">
                      {t.subjects.slice(0, MAX_VISIBLE_SUBJECTS).map((s) => (
                        <span key={s} className="badge badge-neutral badge-sm min-w-0 max-w-[45%] truncate text-2xs" title={subjectDisplayLabel(s)}>
                          <span className="min-w-0 truncate">{subjectDisplayLabel(s)}</span>
                        </span>
                      ))}
                      {t.subjects.length > MAX_VISIBLE_SUBJECTS && (
                        <span className="shrink-0 text-2xs text-(--kt-faint)">+{t.subjects.length - MAX_VISIBLE_SUBJECTS} more</span>
                      )}
                    </div>
                  )}

                  {t.verifiedTopics?.length > 0 && (
                    <div className="min-w-0 space-y-1" aria-label="Certified topics">
                      <p className="text-2xs text-(--kt-faint)">Certified topics</p>
                      <div className="flex min-w-0 flex-wrap gap-1">
                        {t.verifiedTopics.slice(0, MAX_VISIBLE_TOPICS).map((cert) => (
                          <TopicChip
                            key={`${cert.subject}::${cert.topic}`}
                            topic={cert.topic}
                            verified
                            className="min-w-0 max-w-full"
                          />
                        ))}
                        {t.verifiedTopics.length > MAX_VISIBLE_TOPICS && (
                          <span className="self-center text-2xs text-(--kt-faint)">
                            +{t.verifiedTopics.length - MAX_VISIBLE_TOPICS} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {t.verifiedClasses.length > 0 && (
                    <div className="flex max-h-12 flex-wrap items-center gap-1 overflow-hidden">
                      <span className="shrink-0 text-2xs text-(--kt-faint)">Verified classes</span>
                      {t.verifiedClasses.slice(0, MAX_VISIBLE_CLASSES).map((c) => (
                        <span
                          key={c.code}
                          className="badge badge-success badge-sm shrink-0 gap-1 text-2xs"
                          title={`${subjectDisplayLabel(c.subject)} · ${c.code}`}
                        >
                          <BadgeCheck className="h-2.5 w-2.5" />
                          {c.code}
                        </span>
                      ))}
                      {t.verifiedClasses.length > MAX_VISIBLE_CLASSES && (
                        <span className="shrink-0 text-2xs text-(--kt-faint)">+{t.verifiedClasses.length - MAX_VISIBLE_CLASSES} more</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto grid min-w-0 grid-cols-2 gap-2 border-t border-base-300 pt-2 text-2xs text-(--kt-muted)">
                    <span className="flex min-w-0 items-center gap-1 truncate">
                      <BadgeCheck className="h-3 w-3 shrink-0 text-success" />
                      <span className="min-w-0 truncate">{t.verifiedTopicCount} verified {t.verifiedTopicCount === 1 ? "topic" : "topics"}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1 truncate">
                      <GraduationCap className="h-3 w-3 shrink-0 text-primary" />
                      <span className="min-w-0 truncate">{t.publishedClassCount} {t.publishedClassCount === 1 ? "class" : "classes"}</span>
                    </span>
                    {t.nextSessionAt && (
                      <span className="col-span-2 flex min-w-0 items-center gap-1 truncate" title={`Next session ${fmtNext(t.nextSessionAt)}`}>
                        <CalendarClock className="h-3 w-3 shrink-0 text-(--kt-faint)" />
                        <span className="min-w-0 truncate">Next session {fmtNext(t.nextSessionAt)}</span>
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
