"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { useFetchList } from "@/hooks/useFetchList";
import { useTopicCertifications } from "@/hooks/useTopicCertifications";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Tabs from "@/components/ui/Tabs";
import ClassCard from "@/components/classes/ClassCard";
import ClassEmptyState from "@/components/classes/ClassEmptyState";

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
  const router = useRouter();
  const { data: classes, loading, error } = useFetchList<TutorClass>(
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
  const isActive = (c: TutorClass) => c.status === "SCHEDULED" || isCurrentlySuspended(c);

  const activeClasses = classes.filter(isActive);
  const pastClasses = classes.filter((c) => !isActive(c));

  const displayedClasses = activeTab === "active" ? activeClasses : pastClasses;

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      {/* Main Section */}
      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex justify-between items-center">
            <h2 className="card-title text-base font-bold">Class Schedule &amp; Management</h2>
            <Link href="/tutor/classes/new" className="btn btn-primary btn-sm text-xs gap-1 cursor-pointer">
              <Plus className="h-4 w-4" />
              Schedule Class
            </Link>
          </div>

          <p className="text-xs text-base-content/60">
            Schedule 1-on-1 sessions or small group classes for any subject. Tutees will be able to discover and enroll in your scheduled classes.
          </p>

          <Tabs
            tabs={[
              { key: "active", label: "Active Classes", count: activeClasses.length },
              { key: "history", label: "Class History", count: pastClasses.length },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as "active" | "history")}
          />

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : displayedClasses.length === 0 ? (
            <ClassEmptyState
              message={activeTab === "active" ? "No active classes scheduled." : "No past classes found."}
              action={
                activeTab === "active" && (
                  <Link href="/tutor/classes/new" className="btn btn-link btn-xs text-primary mt-1 text-xs">
                    Schedule your first class now
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              {displayedClasses.map((c) => (
                <ClassCard
                  key={c.id}
                  code={c.code}
                  subject={c.subject}
                  gradeLevel={c.gradeLevel}
                  topics={c.topics}
                  verifiedTopics={verifiedTopicsFor(c.subject)}
                  description={c.description}
                  sessions={c.sessions}
                  status={c.status}
                  published={c.published}
                  suspendedReason={c.suspendedReason}
                  enrolledCount={c.enrollments.length}
                  maxStudents={c.maxStudents}
                  activeLabel="Active"
                  onClick={() => router.push(`/tutor/classes/${c.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
