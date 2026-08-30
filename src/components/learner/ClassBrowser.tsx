"use client";

import { useRouter } from "next/navigation";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
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

/**
 * Renders one scope of the learner's class lists:
 *  - "browse" — enrollable classes the learner isn't in yet (`/learner/classes`)
 *  - "mine"   — the learner's enrolled classes (`/learner/my-classes`)
 *
 * Page + page size live in the URL (`?<scope>Page=`, `?<scope>Size=`) via
 * `usePaginatedList`, so navigating into a class and pressing Back restores the
 * exact page the learner was on.
 */
export default function ClassBrowser({ scope }: { scope: "browse" | "mine" }) {
  const router = useRouter();
  const {
    data: classes,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
  } = usePaginatedList<TutorClass>(
    "/api/classes",
    "classes",
    { scope },
    PAGE_SIZE,
    "Could not retrieve classes.",
    scope
  );

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
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[12, 24, 48, 96]}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
