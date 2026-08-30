"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { SubjectArea } from "@prisma/client";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { useFetchList } from "@/hooks/useFetchList";
import { useTopicCertifications } from "@/hooks/useTopicCertifications";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
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
  subject: SubjectArea;
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

interface SessionRow {
  key: string;
  topic: string;
  scheduledAt: string;
  duration: number;
}

let rowIdCounter = 0;
function newRowKey() {
  rowIdCounter += 1;
  return `row-${rowIdCounter}`;
}

const ALL_SUBJECTS = Object.values(SubjectArea);

export default function ClassManagement() {
  const router = useRouter();
  const { data: classes, loading, error, refetch: fetchClasses } = useFetchList<TutorClass>(
    "/api/tutor/classes",
    "Could not retrieve classes."
  );
  const { certifications } = useTopicCertifications();
  const verifiedTopicsFor = (subject: SubjectArea) =>
    certifications.filter((c) => c.subject === subject && c.status === "CERTIFIED").map((c) => c.topic);
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // Modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    subject: "",
    gradeLevel: "",
    description: "",
    maxStudents: 1,
    building: "",
    room: "",
    meetingLink: "",
  });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sessionRows, setSessionRows] = useState<SessionRow[]>([]);
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

  const addSessionRow = () => {
    setSessionRows((prev) => [
      ...prev,
      { key: newRowKey(), topic: selectedTopics[0] ?? "", scheduledAt: "", duration: 60 },
    ]);
  };

  const removeSessionRow = (key: string) => {
    setSessionRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateSessionRow = (key: string, field: "topic" | "scheduledAt" | "duration", value: string | number) => {
    setSessionRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const resetForm = () => {
    setForm({
      subject: "",
      gradeLevel: "",
      description: "",
      maxStudents: 1,
      building: "",
      room: "",
      meetingLink: "",
    });
    setSelectedTopics([]);
    setSessionRows([]);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      // Basic client validation
      if (!form.subject) throw new Error("Please select a subject.");
      if (selectedTopics.length === 0) throw new Error("Please select at least one topic.");
      if (sessionRows.length === 0) throw new Error("Please add at least one session.");
      if (sessionRows.some((r) => !r.topic || !r.scheduledAt)) {
        throw new Error("Every session needs a topic and a date/time.");
      }

      const res = await fetch("/api/tutor/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gradeLevel: form.gradeLevel || null,
          topics: selectedTopics,
          sessions: sessionRows.map((r) => ({
            topic: r.topic,
            scheduledAt: new Date(r.scheduledAt).toISOString(),
            duration: r.duration,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create class.");
      }

      setSuccess("Class scheduled successfully!");
      setIsScheduleOpen(false);
      resetForm();
      fetchClasses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

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

      {/* MODAL 1: SCHEDULE CLASS */}
      {isScheduleOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => {
                setIsScheduleOpen(false);
                setFormError("");
                resetForm();
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

              <FormField label="Target Grade" hint="Optional — helps matching. Leave as 'Any grade' if it's open to all.">
                <select
                  name="gradeLevel"
                  value={form.gradeLevel}
                  onChange={handleInputChange}
                  className="select select-bordered select-sm w-full focus:select-primary text-xs"
                >
                  <option value="">Any grade</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
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

              <FormField label={`Sessions${sessionRows.length > 0 ? ` (${sessionRows.length})` : ""}`} required hint="Each session covers one topic from the ones selected above.">
                {!form.subject || selectedTopics.length === 0 ? (
                  <div className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-3 text-center">
                    Select a subject and at least one topic first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessionRows.map((row) => (
                      <div key={row.key} className="flex items-center gap-1.5 border border-base-200 rounded-lg p-2">
                        <select
                          value={row.topic}
                          onChange={(e) => updateSessionRow(row.key, "topic", e.target.value)}
                          className="select select-bordered select-xs text-2xs flex-1 min-w-0"
                        >
                          {selectedTopics.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <input
                          type="datetime-local"
                          value={row.scheduledAt}
                          onChange={(e) => updateSessionRow(row.key, "scheduledAt", e.target.value)}
                          className="input input-bordered input-xs text-2xs"
                        />
                        <select
                          value={row.duration}
                          onChange={(e) => updateSessionRow(row.key, "duration", Number(e.target.value))}
                          className="select select-bordered select-xs text-2xs"
                        >
                          <option value={30}>30m</option>
                          <option value={45}>45m</option>
                          <option value={60}>60m</option>
                          <option value={90}>90m</option>
                          <option value={120}>120m</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSessionRow(row.key)}
                          className="btn btn-ghost btn-xs text-error shrink-0 cursor-pointer"
                          aria-label="Remove session"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSessionRow}
                      className="btn btn-ghost btn-xs text-2xs font-bold gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add Session
                    </button>
                  </div>
                )}
              </FormField>

              <FormField label="Location" hint="Optional — for an in-person class">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    name="building"
                    value={form.building}
                    onChange={handleInputChange}
                    placeholder="Building"
                    className="input input-bordered input-sm w-full focus:input-primary text-xs"
                  />
                  <input
                    type="text"
                    name="room"
                    value={form.room}
                    onChange={handleInputChange}
                    placeholder="Room"
                    className="input input-bordered input-sm w-32 shrink-0 focus:input-primary text-xs"
                  />
                </div>
              </FormField>

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
                    resetForm();
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

    </div>
  );
}
