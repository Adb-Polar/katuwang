"use client";

import { subjectsInGrade, topicsInGrade } from "@/lib/catalogGrades";
import { useCallback, useEffect, useState } from "react";

export interface CatalogSubject {
  slug: string;
  name: string;
  topics: string[];
  gradeLevels?: unknown;
  topicGrades?: Record<string, unknown>;
  curriculum?: unknown;
  topicDetails?: { name: string; gradeLevels: unknown; curriculum?: unknown }[];
}

/** Fetch the live catalog. Failed reads expose no fallback choices and can be retried. */
export function useSubjectCatalog(gradeLevel?: string) {
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => { setLoading(true); setError(null); setSubjects([]); setVersion(value => value + 1); }, []);
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/subjects", { signal: controller.signal });
        if (!response.ok) throw new Error("The subject catalog is unavailable. Please retry.");
        const json = await response.json();
        if (!Array.isArray(json.subjects)) throw new Error("The subject catalog is unavailable. Please retry.");
        if (!controller.signal.aborted) setSubjects(json.subjects);
      } catch {
        if (!controller.signal.aborted) setError("The subject catalog is unavailable. Please retry.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [version]);
  const topicsFor = (slug: string) => topicsInGrade(subjects.find(subject => subject.slug === slug), gradeLevel);
  return { subjects: subjectsInGrade(subjects, gradeLevel), topicsFor, loading, error, retry };
}
