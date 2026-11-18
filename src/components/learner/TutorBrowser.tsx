"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { useEffect, useRef, useState } from "react";
import { BROWSE_PAGE_SIZE } from "@/lib/pagination";
import { ChevronDown } from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import LoadErrorState from "@/components/ui/LoadErrorState";
import Pagination from "@/components/ui/Pagination";
import TutorCatalogCard, { type TutorCatalogItem } from "./TutorCatalogCard";

const PAGE_SIZE = BROWSE_PAGE_SIZE;
const SUBJECT_GROUPS = [
  { label: "STEM", slugs: ["MATH", "SCIENCE", "RESEARCH_DIGITAL_LITERACY"] },
  { label: "Humanities & social sciences", slugs: ["ENGLISH", "FILIPINO", "ARALING_PANLIPUNAN", "VALUES_EDUCATION"] },
  { label: "Business", slugs: ["BUSINESS_ENTREPRENEURSHIP"] },
  { label: "Arts, health & other", slugs: ["MAPEH", "MISCELLANEOUS"] },
];

interface TutorRow extends TutorCatalogItem {
  image?: string | null;
  verifiedClasses: { code: string; subject: string }[];
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

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3">
          <SearchInput
            label="Search tutors"
            value={q}
            onChange={setQ}
            placeholder={meta.showTutorRealNames === true ? "Search tutors by name or ID" : "Search by tutor ID"}
          />
          <select aria-label="Grade level" className="select select-bordered w-full" value={gradeLevel}
            onFocus={() => subjectMenuRef.current?.removeAttribute("open")}
            onChange={(e) => { setGradeLevel(e.target.value); setSubjects([]); }}>
            <option value="">All grades</option>
            {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <details ref={subjectMenuRef} className="dropdown w-full">
            <summary className="select select-bordered w-full flex items-center justify-between list-none [&::-webkit-details-marker]:hidden bg-none cursor-pointer">
              <span>{subjects.length ? `Teaches ${subjects.length} subject${subjects.length === 1 ? "" : "s"}` : "Any subject"}</span>
              <ChevronDown className="h-4 w-4 text-(--kt-muted)" aria-hidden="true" />
            </summary>
            <div className="dropdown-content z-20 mt-1 rounded-field border border-base-300 bg-base-100 p-3 shadow-md w-72 max-h-72 overflow-y-auto">
              {subjectGroups.filter((group) => group.items.length).map((group) => (
                <fieldset key={group.label} className="mb-2 border-b border-base-200 pb-2 last:border-0">
                  <legend className="text-sm font-medium text-(--kt-muted)">{group.label}</legend>
                  {group.items.map((s) => <label key={s.slug} className="flex items-center gap-2 py-1.5 text-sm">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={subjects.includes(s.slug)}
                      onChange={() => toggleSubject(s.slug)} />{s.name}
                  </label>)}
                </fieldset>
              ))}
              <button type="button" className="link link-hover text-primary text-sm" onClick={() => setSubjects([])}>Clear</button>
            </div>
          </details>
          <select aria-label="Sort matching tutors" className="select select-bordered w-full" value={sort}
            onFocus={() => subjectMenuRef.current?.removeAttribute("open")}
            onChange={(e) => setSort(e.target.value)}>
            <option value="codeAsc">Tutor ID: A–Z</option>
            <option value="codeDesc">Tutor ID: Z–A</option>
            <option value="newest">Newest tutors</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : loadError ? (
          <LoadErrorState message={loadError} onRetry={refetch} />
        ) : tutors.length === 0 ? (
          <p className="kt-card px-5 py-8 text-center text-(--kt-muted)">No verified tutors match these filters yet.</p>
        ) : (
          <>
            <p className="text-sm text-(--kt-muted)">
              {total} tutor{total === 1 ? "" : "s"}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tutors.map((t) => (
                <li key={t.id}>
                  <TutorCatalogCard tutor={t} />
                </li>
              ))}
            </ul>
          </>
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </section>
    </div>
  );
}
