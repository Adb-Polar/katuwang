"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { SubjectArea } from "@prisma/client";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { useFetchList } from "@/hooks/useFetchList";
import { useTopicCertifications } from "@/hooks/useTopicCertifications";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Tabs from "@/components/ui/Tabs";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ClassCard from "@/components/classes/ClassCard";
import ClassEmptyState from "@/components/classes/ClassEmptyState";
import ClassDetailsModalBase from "@/components/classes/ClassDetailsModalBase";
import EnrolledLearnersTable from "@/components/classes/EnrolledLearnersTable";

interface Learner {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  section: string;
}

interface Enrollment {
  id: string;
  learner: Learner;
}

interface TutorClass {
  id: string;
  subject: SubjectArea;
  topics: string[];
  description: string | null;
  scheduledAt: string;
  duration: number;
  maxStudents: number;
  meetingLink: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED";
  enrollments: Enrollment[];
}

type PendingAction = { type: "cancel" | "complete" | "delete"; classId: string } | null;

const ALL_SUBJECTS = Object.values(SubjectArea);

export default function ClassManagement() {
  const { data: classes, loading, error, setError, refetch: fetchClasses } = useFetchList<TutorClass>(
    "/api/tutor/classes",
    "Could not retrieve classes."
  );
  const { certifications } = useTopicCertifications();
  const verifiedTopicsFor = (subject: SubjectArea) =>
    certifications.filter((c) => c.subject === subject && c.status === "CERTIFIED").map((c) => c.topic);
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    subject: "",
    description: "",
    scheduledAt: "",
    duration: 60,
    maxStudents: 1,
    meetingLink: "",
  });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "subject") setSelectedTopics([]);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      // Basic client validation
      if (!form.subject) throw new Error("Please select a subject.");
      if (selectedTopics.length === 0) throw new Error("Please select at least one topic.");
      if (!form.scheduledAt) throw new Error("Please select a scheduled date and time.");

      // Convert datetime to ISO string
      const isoDate = new Date(form.scheduledAt).toISOString();

      const res = await fetch("/api/tutor/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          topics: selectedTopics,
          scheduledAt: isoDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create class.");
      }

      setSuccess("Class scheduled successfully!");
      setIsScheduleOpen(false);
      // Reset form
      setForm({
        subject: "",
        description: "",
        scheduledAt: "",
        duration: 60,
        maxStudents: 1,
        meetingLink: "",
      });
      setSelectedTopics([]);
      fetchClasses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (classId: string, status: "COMPLETED" | "CANCELLED") => {
    try {
      const res = await fetch(`/api/tutor/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");

      setSuccess(`Class marked as ${status.toLowerCase()} successfully!`);
      setSelectedClass(null);
      fetchClasses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/tutor/classes/${classId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete class.");

      setSuccess("Class deleted successfully!");
      setSelectedClass(null);
      fetchClasses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    if (pendingAction.type === "delete") {
      await handleDeleteClass(pendingAction.classId);
    } else {
      await handleUpdateStatus(pendingAction.classId, pendingAction.type === "cancel" ? "CANCELLED" : "COMPLETED");
    }
    setActionLoading(false);
    setPendingAction(null);
  };

  // Filter classes
  const activeClasses = classes.filter((c) => c.status === "SCHEDULED");
  const pastClasses = classes.filter((c) => c.status !== "SCHEDULED");

  const displayedClasses = activeTab === "active" ? activeClasses : pastClasses;

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      {/* Main Section */}
      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <div className="flex justify-between items-center">
            <h2 className="card-title text-sm font-bold">Class Schedule & Management</h2>
            <button onClick={() => setIsScheduleOpen(true)} className="btn btn-primary btn-sm text-xs gap-1 cursor-pointer">
              <Plus className="h-4 w-4" />
              Schedule Class
            </button>
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
                  <button onClick={() => setIsScheduleOpen(true)} className="btn btn-link btn-xs text-primary mt-1 text-xs">
                    Schedule your first class now
                  </button>
                )
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              {displayedClasses.map((c) => (
                <ClassCard
                  key={c.id}
                  subject={c.subject}
                  topics={c.topics}
                  verifiedTopics={verifiedTopicsFor(c.subject)}
                  description={c.description}
                  scheduledAt={c.scheduledAt}
                  duration={c.duration}
                  status={c.status}
                  enrolledCount={c.enrollments.length}
                  maxStudents={c.maxStudents}
                  activeLabel="Active"
                  onClick={() => setSelectedClass(c)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL 1: SCHEDULE CLASS */}
      {isScheduleOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => {
                setIsScheduleOpen(false);
                setFormError("");
              }}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-4">Schedule a Tutoring Class</h3>

            <FeedbackBanner variant="error" message={formError || null} />

            <form onSubmit={handleCreateClass} className="space-y-3.5 mt-3.5">
              <FormField label="Subject Area" required>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleInputChange}
                  required
                  className="select select-bordered select-sm w-full focus:select-primary text-xs"
                >
                  <option value="">Select subject</option>
                  {ALL_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={`Topic(s)${selectedTopics.length > 0 ? ` (${selectedTopics.length} selected)` : ""}`} required>
                {!form.subject ? (
                  <div className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-3 text-center">
                    Select a subject to see available topics.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border border-base-200 rounded-lg p-2">
                    {SUBJECT_TOPICS[form.subject as SubjectArea].map((topic) => (
                      <label key={topic} className="flex items-center gap-1.5 text-2xs cursor-pointer p-1 rounded hover:bg-base-200/50">
                        <input
                          type="checkbox"
                          checked={selectedTopics.includes(topic)}
                          onChange={() => toggleTopic(topic)}
                          className="checkbox checkbox-xs checkbox-primary"
                        />
                        <span>{topic}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FormField>

              <FormField label="Description" hint="Optional">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Briefly explain what will be covered in this class..."
                  className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Scheduled At" required>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={form.scheduledAt}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered input-sm w-full focus:input-primary text-xs"
                  />
                </FormField>

                <FormField label="Duration" required>
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleInputChange}
                    required
                    className="select select-bordered select-sm w-full focus:select-primary text-xs"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Max Capacity" required>
                  <input
                    type="number"
                    name="maxStudents"
                    value={form.maxStudents}
                    onChange={handleInputChange}
                    required
                    min={1}
                    max={10}
                    className="input input-bordered input-sm w-full focus:input-primary text-xs"
                  />
                </FormField>

                <FormField label="Meeting Link" hint="Optional">
                  <input
                    type="url"
                    name="meetingLink"
                    value={form.meetingLink}
                    onChange={handleInputChange}
                    placeholder="https://meet.google.com/..."
                    className="input input-bordered input-sm w-full focus:input-primary text-xs"
                  />
                </FormField>
              </div>

              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleOpen(false);
                    setFormError("");
                  }}
                  className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn btn-primary btn-sm text-xs cursor-pointer">
                  {formLoading ? <span className="loading loading-spinner loading-xs"></span> : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLASS DETAILS & ACTIONS */}
      {selectedClass && (
        <ClassDetailsModalBase
          subject={selectedClass.subject}
          topics={selectedClass.topics}
          verifiedTopics={verifiedTopicsFor(selectedClass.subject)}
          scheduledAt={selectedClass.scheduledAt}
          duration={selectedClass.duration}
          meetingLink={selectedClass.meetingLink}
          description={selectedClass.description}
          onClose={() => setSelectedClass(null)}
          belowDescription={
            <EnrolledLearnersTable enrollments={selectedClass.enrollments} maxStudents={selectedClass.maxStudents} />
          }
          actions={
            <div className="modal-action pt-2 flex flex-wrap gap-2 justify-between items-center w-full">
              <div>
                {selectedClass.status === "SCHEDULED" && selectedClass.enrollments.length === 0 && (
                  <button
                    onClick={() => setPendingAction({ type: "delete", classId: selectedClass.id })}
                    className="btn btn-error btn-outline btn-sm text-xs gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Class
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
                >
                  Close
                </button>

                {selectedClass.status === "SCHEDULED" && (
                  <>
                    <button
                      onClick={() => setPendingAction({ type: "cancel", classId: selectedClass.id })}
                      className="btn btn-error btn-sm text-xs gap-1 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel Class
                    </button>
                    <button
                      onClick={() => setPendingAction({ type: "complete", classId: selectedClass.id })}
                      className="btn btn-success btn-sm text-xs gap-1 cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Complete Class
                    </button>
                  </>
                )}
              </div>
            </div>
          }
        />
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "delete"
            ? "Delete this class?"
            : `Mark this class as ${pendingAction?.type === "cancel" ? "cancelled" : "completed"}?`
        }
        description={pendingAction?.type === "delete" ? "This cannot be undone." : undefined}
        confirmLabel={pendingAction?.type === "delete" ? "Delete" : "Confirm"}
        tone={pendingAction?.type === "delete" || pendingAction?.type === "cancel" ? "danger" : "default"}
        loading={actionLoading}
        onConfirm={handleConfirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
