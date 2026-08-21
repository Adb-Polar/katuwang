"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, Users, Link as LinkIcon, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { SubjectArea } from "@prisma/client";

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
  topic: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  maxStudents: number;
  meetingLink: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  enrollments: Enrollment[];
}

interface ClassManagementProps {
  certifiedSubjects: SubjectArea[];
}

export default function ClassManagement({ certifiedSubjects }: ClassManagementProps) {
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);

  // Form state
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    description: "",
    scheduledAt: "",
    duration: 60,
    maxStudents: 1,
    meetingLink: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tutor/classes");
      if (!res.ok) throw new Error("Failed to fetch classes.");
      const data = await res.json();
      setClasses(data);
    } catch (err: any) {
      setError(err.message || "Could not retrieve classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      // Basic client validation
      if (!form.subject) throw new Error("Please select a subject.");
      if (!form.topic) throw new Error("Topic is required.");
      if (!form.scheduledAt) throw new Error("Please select a scheduled date and time.");

      // Convert datetime to ISO string
      const isoDate = new Date(form.scheduledAt).toISOString();

      const res = await fetch("/api/tutor/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
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
        topic: "",
        description: "",
        scheduledAt: "",
        duration: 60,
        maxStudents: 1,
        meetingLink: "",
      });
      fetchClasses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (classId: string, status: "COMPLETED" | "CANCELLED") => {
    if (!confirm(`Are you sure you want to mark this class as ${status.toLowerCase()}?`)) return;

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
      alert(err.message);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This cannot be undone.")) return;

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
      alert(err.message);
    }
  };

  // Filter classes
  const activeClasses = classes.filter((c) => c.status === "SCHEDULED");
  const pastClasses = classes.filter((c) => c.status !== "SCHEDULED");

  const displayedClasses = activeTab === "active" ? activeClasses : pastClasses;

  return (
    <div className="space-y-6">
      {success && (
        <div className="alert alert-success text-xs py-3 text-white">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-xs py-3 text-white">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Section */}
      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <div className="flex justify-between items-center">
            <h2 className="card-title text-sm font-bold">Class Schedule & Management</h2>
            <button
              onClick={() => {
                if (certifiedSubjects.length === 0) {
                  alert("You must be certified in at least one subject to schedule a class.");
                  return;
                }
                setIsScheduleOpen(true);
              }}
              className="btn btn-primary btn-sm text-xs gap-1 cursor-pointer text-white"
            >
              <Plus className="h-4 w-4" />
              Schedule Class
            </button>
          </div>

          <p className="text-xs text-base-content/60">
            Schedule 1-on-1 sessions or small group classes for your certified subjects. Tutees will be able to discover and enroll in your scheduled classes.
          </p>

          {/* Tabs */}
          <div className="tabs tabs-lifted mt-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`tab tab-sm text-xs font-semibold ${activeTab === "active" ? "tab-active font-bold" : ""}`}
            >
              Active Classes ({activeClasses.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`tab tab-sm text-xs font-semibold ${activeTab === "history" ? "tab-active font-bold" : ""}`}
            >
              Class History ({pastClasses.length})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : displayedClasses.length === 0 ? (
            <div className="text-center py-10 bg-base-200/20 border border-dashed border-base-300 rounded-xl">
              <Calendar className="h-8 w-8 mx-auto text-base-content/30 mb-2" />
              <p className="text-xs font-semibold text-base-content/50">
                {activeTab === "active" ? "No active classes scheduled." : "No past classes found."}
              </p>
              {activeTab === "active" && certifiedSubjects.length > 0 && (
                <button
                  onClick={() => setIsScheduleOpen(true)}
                  className="btn btn-link btn-xs text-primary mt-1 text-xs"
                >
                  Schedule your first class now
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              {displayedClasses.map((c) => {
                const isFull = c.enrollments.length >= c.maxStudents;
                const formattedDate = new Date(c.scheduledAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClass(c)}
                    className="card bg-base-200/30 hover:bg-base-200/50 border border-base-200 cursor-pointer transition duration-200 text-xs p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="badge badge-neutral text-[10px] font-bold tracking-wide uppercase px-2 py-2">
                        {c.subject}
                      </span>
                      <span
                        className={`badge text-[9px] font-black py-2 ${
                          c.status === "SCHEDULED"
                            ? isFull
                              ? "badge-warning"
                              : "badge-success text-white"
                            : c.status === "COMPLETED"
                            ? "badge-info text-white"
                            : "badge-error text-white"
                        }`}
                      >
                        {c.status === "SCHEDULED" ? (isFull ? "FULL" : "ACTIVE") : c.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-base-content/90 truncate">{c.topic}</h3>
                      {c.description && (
                        <p className="text-base-content/60 line-clamp-2 leading-relaxed">{c.description}</p>
                      )}
                    </div>

                    <div className="divider my-0 opacity-40"></div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base-content/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{c.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {c.enrollments.length} / {c.maxStudents} Enrolled
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <h3 className="text-base font-bold mb-4">Schedule a Tutoring Class</h3>

            {formError && (
              <div className="alert alert-error text-[11px] py-2 mb-4 text-white">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-3.5">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs text-base-content/85">Subject Area *</span>
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleInputChange}
                  required
                  className="select select-bordered select-sm w-full focus:select-primary text-xs"
                >
                  <option value="">Select subject</option>
                  {certifiedSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs text-base-content/85">Topic *</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={form.topic}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Fractions and Decimals"
                  className="input input-bordered input-sm w-full focus:input-primary text-xs"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs text-base-content/85">Description (optional)</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Briefly explain what will be covered in this class..."
                  className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content/85">Scheduled At *</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={form.scheduledAt}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered input-sm w-full focus:input-primary text-xs"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content/85">Duration *</span>
                  </label>
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content/85">Max Capacity *</span>
                  </label>
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
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content/85">Meeting Link</span>
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={form.meetingLink}
                    onChange={handleInputChange}
                    placeholder="https://meet.google.com/..."
                    className="input input-bordered input-sm w-full focus:input-primary text-xs"
                  />
                </div>
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
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary btn-sm text-xs cursor-pointer text-white"
                >
                  {formLoading ? <span className="loading loading-spinner loading-xs"></span> : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLASS DETAILS & ACTIONS */}
      {selectedClass && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl text-xs space-y-4">
            <button
              onClick={() => setSelectedClass(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <span className="badge badge-neutral tracking-wider text-[10px] uppercase font-bold px-2.5 py-2.5">
                {selectedClass.subject}
              </span>
              <h3 className="text-base font-bold text-base-content mt-1.5">{selectedClass.topic}</h3>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-3 bg-base-200/30 border border-base-200 rounded-xl p-3.5 text-base-content/80">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-semibold text-[10px] text-base-content/50">DATE & TIME</div>
                  <div className="font-medium">
                    {new Date(selectedClass.scheduledAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-semibold text-[10px] text-base-content/50">DURATION</div>
                  <div className="font-medium">{selectedClass.duration} minutes</div>
                </div>
              </div>
              <div className="col-span-2 divider my-0.5 opacity-40"></div>
              <div className="col-span-2 flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="font-semibold text-[10px] text-base-content/50">MEETING LINK</div>
                  {selectedClass.meetingLink ? (
                    <a
                      href={selectedClass.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary font-medium break-all"
                    >
                      {selectedClass.meetingLink}
                    </a>
                  ) : (
                    <span className="text-base-content/40 italic">No link provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedClass.description && (
              <div className="space-y-1">
                <div className="font-bold text-base-content/50 text-[10px] uppercase">Class Description</div>
                <p className="text-base-content/70 leading-relaxed bg-base-200/10 p-3 border border-base-200 rounded-xl">
                  {selectedClass.description}
                </p>
              </div>
            )}

            {/* Enrollments / Learners List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="font-bold text-base-content/50 text-[10px] uppercase">
                  Enrolled Learners ({selectedClass.enrollments.length} / {selectedClass.maxStudents})
                </div>
              </div>

              {selectedClass.enrollments.length === 0 ? (
                <div className="text-center py-6 bg-base-200/10 border border-base-200 rounded-xl text-base-content/40 italic">
                  No learners have enrolled in this class yet.
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2 border border-base-200 rounded-xl p-2 bg-base-200/10">
                  {selectedClass.enrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="flex items-center justify-between p-2.5 bg-base-100 border border-base-200 rounded-lg"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-primary">{enr.learner.anonymousId}</span>
                        <div className="text-[10px] text-base-content/50">
                          {enr.learner.firstName} {enr.learner.lastName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="badge badge-neutral text-[9px] font-semibold py-1.5 px-2">
                          {enr.learner.gradeLevel.replace("_", " ")}
                        </span>
                        <div className="text-[10px] text-base-content/50 mt-0.5">Section: {enr.learner.section}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="modal-action pt-2 flex flex-wrap gap-2 justify-between items-center w-full">
              <div>
                {selectedClass.status === "SCHEDULED" && selectedClass.enrollments.length === 0 && (
                  <button
                    onClick={() => handleDeleteClass(selectedClass.id)}
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
                      onClick={() => handleUpdateStatus(selectedClass.id, "CANCELLED")}
                      className="btn btn-error btn-sm text-xs gap-1 cursor-pointer text-white"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel Class
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedClass.id, "COMPLETED")}
                      className="btn btn-success btn-sm text-xs gap-1 cursor-pointer text-white"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Complete Class
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
