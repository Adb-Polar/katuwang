"use client";

import { useState } from "react";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { SubjectArea } from "@prisma/client";
import { useFetchList } from "@/hooks/useFetchList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import Tabs from "@/components/ui/Tabs";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ClassCard from "@/components/classes/ClassCard";
import ClassEmptyState from "@/components/classes/ClassEmptyState";
import ClassDetailsModalBase from "@/components/classes/ClassDetailsModalBase";

interface Tutor {
  id: string;
  anonymousId: string;
}

interface TutorClass {
  id: string;
  subject: SubjectArea;
  topics: string[];
  verifiedTopics: string[];
  description: string | null;
  scheduledAt: string;
  duration: number;
  maxStudents: number;
  meetingLink: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  tutor: Tutor;
  _count: { enrollments: number };
  enrollments: { id: string }[];
}

export default function ClassBrowser() {
  const { data: classes, loading, error, setError, refetch: fetchClasses } = useFetchList<TutorClass>(
    "/api/classes",
    "Could not retrieve classes."
  );
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "mine">("browse");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);

  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);

  const handleEnroll = async (classId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/enroll`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll.");

      setSuccess("Enrolled successfully!");
      setSelectedClass(null);
      fetchClasses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async (classId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/enroll`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unenroll.");

      setSuccess("Unenrolled successfully!");
      setSelectedClass(null);
      fetchClasses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
      setConfirmUnenroll(false);
    }
  };

  const now = new Date();
  const browsableClasses = classes.filter(
    (c) => c.status === "SCHEDULED" && new Date(c.scheduledAt) > now && c.enrollments.length === 0
  );
  const myClasses = classes.filter((c) => c.enrollments.length > 0);

  const displayedClasses = activeTab === "browse" ? browsableClasses : myClasses;

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      {/* Main Section */}
      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Tutoring Classes</h2>
          <p className="text-xs text-base-content/60">
            Browse upcoming classes from certified Student Tutors and enroll in the ones that fit your schedule.
          </p>

          <Tabs
            tabs={[
              { key: "browse", label: "Browse", count: browsableClasses.length },
              { key: "mine", label: "My Classes", count: myClasses.length },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as "browse" | "mine")}
          />

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : displayedClasses.length === 0 ? (
            <ClassEmptyState
              message={
                activeTab === "browse" ? "No upcoming classes available right now." : "You haven't enrolled in any classes yet."
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              {displayedClasses.map((c) => (
                <ClassCard
                  key={c.id}
                  subject={c.subject}
                  topics={c.topics}
                  verifiedTopics={c.verifiedTopics}
                  description={c.description}
                  scheduledAt={c.scheduledAt}
                  duration={c.duration}
                  status={c.status}
                  enrolledCount={c._count.enrollments}
                  maxStudents={c.maxStudents}
                  activeLabel="Open"
                  onClick={() => setSelectedClass(c)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL: CLASS DETAILS & ACTIONS */}
      {selectedClass && (
        <ClassDetailsModalBase
          subject={selectedClass.subject}
          topics={selectedClass.topics}
          verifiedTopics={selectedClass.verifiedTopics}
          scheduledAt={selectedClass.scheduledAt}
          duration={selectedClass.duration}
          meetingLink={selectedClass.meetingLink}
          description={selectedClass.description}
          onClose={() => setSelectedClass(null)}
          gridExtra={
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-2xs text-base-content/50">TUTOR</div>
                <AnonymousIdBadge id={selectedClass.tutor.anonymousId} role="TUTOR" />
              </div>
            </div>
          }
          actions={
            <div className="modal-action pt-2 flex gap-2 justify-end w-full">
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Close
              </button>

              {selectedClass.enrollments.length > 0 ? (
                selectedClass.status === "SCHEDULED" && (
                  <button
                    onClick={() => setConfirmUnenroll(true)}
                    disabled={actionLoading}
                    className="btn btn-error btn-sm text-xs gap-1 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Unenroll
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleEnroll(selectedClass.id)}
                  disabled={actionLoading || selectedClass._count.enrollments >= selectedClass.maxStudents}
                  className="btn btn-primary btn-sm text-xs gap-1 cursor-pointer"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {selectedClass._count.enrollments >= selectedClass.maxStudents ? "Full" : "Enroll"}
                </button>
              )}
            </div>
          }
        />
      )}

      <ConfirmDialog
        open={confirmUnenroll}
        title="Unenroll from this class?"
        description="You can browse and re-enroll later if seats are still available."
        confirmLabel="Unenroll"
        tone="danger"
        loading={actionLoading}
        onConfirm={() => selectedClass && handleUnenroll(selectedClass.id)}
        onCancel={() => setConfirmUnenroll(false)}
      />
    </div>
  );
}
