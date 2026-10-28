"use client";

import { SUBJECT_NAMES } from "@/lib/subjectCatalog";
import { curriculumFor } from "@/lib/curriculum";

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
  curriculum?: unknown;
  topicDetails?: { name: string; gradeLevels: unknown; curriculum?: unknown }[];
}

// Static SUBJECT_TOPICS as the instant, offline-safe seed; `/api/subjects`
// (admin-managed) replaces it once fetched.
const STATIC: CatalogSubject[] = SUBJECT_SLUGS.map((slug) => ({
  slug,
  name: SUBJECT_NAMES[slug] ?? slug,
  gradeLevels: curriculumFor(slug).curriculum ? curriculumFor(slug).gradeLevels : defaultSubjectGrades(slug),
  curriculum: curriculumFor(slug).curriculum,
  topicGrades: Object.fromEntries(SUBJECT_TOPICS[slug].map((name) => [name, curriculumFor(slug, name).curriculum ? curriculumFor(slug, name).gradeLevels : null])),
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
