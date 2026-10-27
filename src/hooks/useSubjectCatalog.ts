"use client";

import { defaultSubjectGrades } from "@/lib/subjectGradeDefaults";
import { subjectsInGrade, topicsInGrade } from "@/lib/catalogGrades";
import { useEffect, useState } from "react";
import { SUBJECT_TOPICS, SUBJECT_SLUGS } from "@/lib/subjectTopics";

export interface CatalogSubject {
  slug: string;
  name: string;
  topics: string[];
  gradeLevels?: unknown;
  topicGrades?: Record<string, unknown>;
}

// Static SUBJECT_TOPICS as the instant, offline-safe seed; `/api/subjects`
// (admin-managed) replaces it once fetched.
const STATIC: CatalogSubject[] = SUBJECT_SLUGS.map((slug) => ({
  slug,
  name: slug,
  gradeLevels: defaultSubjectGrades(slug),
  topics: [...SUBJECT_TOPICS[slug as keyof typeof SUBJECT_TOPICS]],
}));

let cached: CatalogSubject[] | null = null;

/**
 * The subject/topic catalogue for client dropdowns. Renders immediately from
 * the static map, then swaps to the live admin-managed list.
 */
export function useSubjectCatalog(gradeLevel?: string): {
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

  const topicsFor = (slug: string) => topicsInGrade(subjects.find((s) => s.slug === slug), gradeLevel);
  return { subjects: subjectsInGrade(subjects, gradeLevel), topicsFor };
}
