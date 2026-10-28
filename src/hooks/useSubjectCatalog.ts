"use client";

import { useEffect, useState } from "react";
import { curriculumFor, readGradeLevels } from "@/lib/curriculum";
import type { GradeLevel } from "@prisma/client";
import { SUBJECT_TOPICS, SUBJECT_SLUGS } from "@/lib/subjectTopics";

export interface CatalogSubject {
  slug: string;
  name: string;
  topics: string[];
  gradeLevels: GradeLevel[];
  curriculum?: unknown;
  topicDetails: { name: string; gradeLevels: GradeLevel[]; curriculum?: unknown }[];
}

// Static SUBJECT_TOPICS as the instant, offline-safe seed; `/api/subjects`
// (admin-managed) replaces it once fetched.
const STATIC: CatalogSubject[] = SUBJECT_SLUGS.map((slug) => ({
  ...curriculumFor(slug),
  topicDetails: SUBJECT_TOPICS[slug].map((name) => ({ name, ...curriculumFor(slug, name) })),
  slug,
  name: slug,
  topics: [...SUBJECT_TOPICS[slug as keyof typeof SUBJECT_TOPICS]],
}));

let cached: CatalogSubject[] | null = null;

/**
 * The subject/topic catalogue for client dropdowns. Renders immediately from
 * the static map, then swaps to the live admin-managed list.
 */
export function useSubjectCatalog(): {
  subjects: CatalogSubject[];
  topicsFor: (slug: string, grade?: GradeLevel) => string[];
} {
  const [subjects, setSubjects] = useState<CatalogSubject[]>(cached ?? STATIC);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subjects");
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !Array.isArray(json.subjects)) return;
        cached = json.subjects as CatalogSubject[];
        setSubjects(cached);
      } catch {
        // keep the static fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topicsFor = (slug: string, grade?: GradeLevel) => {
    const subject = subjects.find((s) => s.slug === slug);
    if (!grade) return subject?.topics ?? [];
    return (subject?.topicDetails ?? []).filter((t) => readGradeLevels(t.gradeLevels).includes(grade)).map((t) => t.name);
  };
  return { subjects, topicsFor };
}
