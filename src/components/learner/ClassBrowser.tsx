"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubjectArea } from "@prisma/client";
import { getCachedClasses, setCachedClasses } from "@/lib/classBrowserCache";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import ClassCard from "@/components/classes/ClassCard";
import ClassEmptyState from "@/components/classes/ClassEmptyState";

const PAGE_SIZE = 12;

interface ClassSession {
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

interface TutorClass {
  id: string;
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

interface ClassesResponse {
  classes: TutorClass[];
  page: number;
  pageSize: number;
  total: number;
  counts: { browse: number; mine: number };
}

/**
 * Renders one scope of the learner's class lists:
 *  - "browse" — enrollable classes the learner isn't in yet (`/learner/classes`)
 *  - "mine"   — the learner's enrolled classes (`/learner/my-classes`)
 */
export default function ClassBrowser({ scope }: { scope: "browse" | "mine" }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ClassesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const key = `${scope}:${page}:${PAGE_SIZE}`;

    async function load() {
      const cached = getCachedClasses<ClassesResponse>(key);
      if (cached) {
        if (!cancelled) {
          setData(cached);
          setError("");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/classes?scope=${scope}&page=${page}&pageSize=${PAGE_SIZE}`);
        if (!res.ok) throw new Error("Could not retrieve classes.");
        const json: ClassesResponse = await res.json();
        setCachedClasses(key, json);
        if (!cancelled) {
          setData(json);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not retrieve classes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [scope, page]);

  const classes = data?.classes ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : classes.length === 0 ? (
            <ClassEmptyState
              message={
                scope === "browse"
                  ? "No upcoming classes available right now."
                  : "You haven't enrolled in any classes yet."
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
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
