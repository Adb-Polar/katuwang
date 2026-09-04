"use client";

import { useEffect, useState } from "react";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";

export interface CatalogSubject {
  slug: string;
  name: string;
  topics: string[];
}

// Static SUBJECT_TOPICS as the instant, offline-safe seed; `/api/subjects`
// (admin-managed) replaces it once fetched.
const STATIC: CatalogSubject[] = (Object.keys(SUBJECT_TOPICS) as string[]).map((slug) => ({
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
  topicsFor: (slug: string) => string[];
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

  const topicsFor = (slug: string) => subjects.find((s) => s.slug === slug)?.topics ?? [];
  return { subjects, topicsFor };
}
