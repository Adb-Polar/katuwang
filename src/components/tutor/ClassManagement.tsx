"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeOff } from "lucide-react";

import { useFetchList } from "@/hooks/useFetchList";
import LoadErrorState from "@/components/ui/LoadErrorState";
import { useTopicCertifications } from "@/hooks/useTopicCertifications";
import Tabs from "@/components/ui/Tabs";
import ClassCatalogCard from "@/components/classes/ClassCatalogCard";
import ClassEmptyState from "@/components/classes/ClassEmptyState";
import LoadingRow from "@/components/ui/LoadingRow";

interface Learner {
  id: string;
  anonymousId: string;
  gradeLevel: string;
  section: string;
}

interface Enrollment {
  id: string;
  learner: Learner;
}

interface ClassSession {
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

interface TutorClass {
  id: string;
  code: string;
  subject: string;
  gradeLevel: string | null;
  topics: string[];
  description: string | null;
  sessions: ClassSession[];
  maxStudents: number;
  meetingLink: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  published: boolean;
  suspendedReason: string | null;
  suspendedUntil: string | null;
  enrollments: Enrollment[];
}

export default function ClassManagement() {
  const { data: classes, loading, loadError, refetch } = useFetchList<TutorClass>(
    "/api/tutor/classes",
    "Could not retrieve classes."
  );
  const { certifications } = useTopicCertifications();
  const verifiedTopicsFor = (subject: string) =>
    certifications.filter((c) => c.subject === subject && c.status === "CERTIFIED").map((c) => c.topic);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // A SUSPENDED class stays in "Active" while the suspension is still in effect
  // (no end date, or the end date is in the future) so the tutor keeps seeing it
  // with its reason. BANNED and expired suspensions fall through to History.
  const isCurrentlySuspended = (c: TutorClass) =>
    c.status === "SUSPENDED" && (!c.suspendedUntil || new Date(c.suspendedUntil) > new Date());
  // A SCHEDULED class with every session in the past is invisible to browse
  // (see browseClassesWhere) — once it also has no enrolled students, keep it
  // out of "Active" too, since there's nothing left for the tutor to act on.
  const hasFutureSession = (c: TutorClass) =>
    c.sessions.some((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > new Date());
  const isActive = (c: TutorClass) =>
    isCurrentlySuspended(c) ||
    (c.status === "SCHEDULED" && (hasFutureSession(c) || c.enrollments.length > 0));

  const activeClasses = classes.filter(isActive);
  const pastClasses = classes.filter((c) => !isActive(c));

  const displayedClasses = activeTab === "active" ? activeClasses : pastClasses;

  return (
    <section className="flex flex-col gap-4">
      <Tabs
        tabs={[
          { key: "active", label: "Active", count: activeClasses.length },
          { key: "history", label: "History", count: pastClasses.length },
        ]}
        active={activeTab}
        onChange={(key) => setActiveTab(key as "active" | "history")}
      />

      {loading ? (
        <LoadingRow />
      ) : loadError ? (
        <LoadErrorState message={loadError} onRetry={refetch} />
      ) : displayedClasses.length === 0 ? (
        <ClassEmptyState
          message={activeTab === "active" ? "No active classes." : "No past classes yet."}
          action={
            activeTab === "active" && (
              <Link href="/tutor/classes/new" className="link text-primary">
                Schedule a class
              </Link>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayedClasses.map((c) => (
            <li key={c.id}>
              <ClassCatalogCard
                href={`/tutor/classes/${c.id}`}
                code={c.code}
                subject={c.subject}
                gradeLevel={c.gradeLevel}
                topics={c.topics}
                verifiedTopics={verifiedTopicsFor(c.subject)}
                sessions={c.sessions}
                status={c.status}
                enrolledCount={c.enrollments.length}
                maxStudents={c.maxStudents}
                showSeats={false}
                aside={<ClassStateText tutorClass={c} />}
                notice={isModerated(c) && c.suspendedReason ? `Reason: ${c.suspendedReason}` : null}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const isModerated = (c: TutorClass) => c.status === "SUSPENDED" || c.status === "BANNED";

/** Bottom-right of a tutor's class card: moderation, then lifecycle, then visibility, else enrolment. */
function ClassStateText({ tutorClass: c }: { tutorClass: TutorClass }) {
  if (isModerated(c)) return <span className="text-error">{c.status === "BANNED" ? "Banned" : "Suspended"}</span>;
  if (c.status === "COMPLETED") return <span className="text-(--kt-muted)">Completed</span>;
  if (c.status === "CANCELLED") return <span className="text-error">Cancelled</span>;
  if (!c.published) {
    return (
      <span className="inline-flex items-center gap-1">
        <EyeOff className="h-4 w-4" aria-hidden="true" />
        Not published
      </span>
    );
  }
  const enrolled = c.enrollments.length;
  return (
    <span className={enrolled >= c.maxStudents ? "text-primary" : "text-(--kt-muted)"}>
      {enrolled >= c.maxStudents ? "Full" : `${enrolled} of ${c.maxStudents} enrolled`}
    </span>
  );
}
