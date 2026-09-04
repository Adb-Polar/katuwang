"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Link as LinkIcon,
  Users,
  BadgeCheck,
  Plus,
  X,
  Lock,
  MapPin,
  EyeOff,
} from "lucide-react";
import { GradeLevel } from "@prisma/client";
import { normalizeTopic } from "@/lib/subjectTopics";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import SessionsList, { SessionSummary } from "@/components/classes/SessionsList";
import SessionActions from "@/components/tutor/SessionActions";
import AddSessionModal from "@/components/tutor/AddSessionModal";
import { getClassStatusBadge, ClassLifecycleStatus } from "@/components/classes/classStatus";
import ClassModerationPanel from "@/components/classes/ClassModerationPanel";
import ClassAppealCard, { type ClassAppealSummary } from "@/components/tutor/ClassAppealCard";

export default function EditClassForm({
  classId,
  subject,
  gradeLevel,
  status,
  activeLabel,
  published,
  currentTopics,
  verifiedTopics,
  /** Topics currently used by one of the class's sessions — can't be unchecked. */
  usedTopics,
  description,
  maxStudents,
  enrolledCount,
  building,
  room,
  meetingLink,
  sessions,
  classTopics,
  /** SUSPENDED/BANNED classes render read-only with a status panel instead of a hard block. */
  locked = false,
  suspendedReason = null,
  suspendedUntil = null,
  appeal = null,
}: {
  classId: string;
  subject: string;
  gradeLevel: GradeLevel | null;
  status: ClassLifecycleStatus;
  activeLabel: string;
  published: boolean;
  currentTopics: string[];
  verifiedTopics?: string[];
  usedTopics: string[];
  description: string | null;
  maxStudents: number;
  enrolledCount: number;
  building: string | null;
  room: string | null;
  meetingLink: string | null;
  sessions: SessionSummary[];
  classTopics: string[];
  locked?: boolean;
  suspendedReason?: string | null;
  suspendedUntil?: string | null;
  appeal?: ClassAppealSummary | null;
}) {
  const router = useRouter();
  const { topicsFor } = useSubjectCatalog();
  const backHref = `/tutor/classes/${classId}`;
  const [topics, setTopics] = useState<string[]>(currentTopics);
  const [customTopic, setCustomTopic] = useState("");
  const [form, setForm] = useState({
    description: description ?? "",
    maxStudents,
    gradeLevel: gradeLevel ?? "",
    building: building ?? "",
    room: room ?? "",
    meetingLink: meetingLink ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFull = enrolledCount >= maxStudents;
  const { tone, label } = getClassStatusBadge(status, isFull, activeLabel);
  const fillPct = Math.min(100, Math.round((enrolledCount / form.maxStudents) * 100));

  const toggleTopic = (topic: string) => {
    if (usedTopics.includes(topic)) return;
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const addCustomTopic = () => {
    const t = normalizeTopic(customTopic);
    if (t.length < 2 || topics.length >= 10) return;
    if (!topics.some((s) => s.toLowerCase() === t.toLowerCase())) setTopics((prev) => [...prev, t]);
    setCustomTopic("");
  };

  // Curated topics for this subject, plus any custom topics already on the class.
  const curated = topicsFor(subject);
  const topicOptions = [
    ...curated,
    ...topics.filter((t) => !curated.some((k) => k.toLowerCase() === t.toLowerCase())),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          maxStudents: form.maxStudents,
          gradeLevel: form.gradeLevel || null,
          building: form.building,
          room: form.room,
          meetingLink: form.meetingLink,
          topics,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");
      router.push(backHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`space-y-6 rounded-box ${
        locked
          ? "bg-error/5 border border-error/20 p-4"
          : !published
          ? "bg-base-300 border border-base-content/10 p-4"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href={backHref} className="btn btn-ghost btn-sm text-xs gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Class
        </Link>
        <div className="flex items-center gap-2">
          <Link href={backHref} className="btn btn-neutral btn-outline btn-sm text-xs">
            {locked ? "Back" : "Cancel"}
          </Link>
          {!locked && (
            <button
              type="submit"
              form="edit-class-form"
              disabled={loading}
              className="btn btn-primary btn-sm text-xs cursor-pointer"
            >
              {loading ? <span className="loading loading-spinner loading-xs"></span> : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {locked && (status === "SUSPENDED" || status === "BANNED") && (
        <div className="space-y-3">
          <ClassModerationPanel
            status={status}
            suspendedReason={suspendedReason}
            suspendedUntil={suspendedUntil}
            audience="tutor"
          />
          <ClassAppealCard classId={classId} appeal={appeal} />
        </div>
      )}

      <FeedbackBanner variant="error" message={error || null} />

      <form id="edit-class-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-neutral tracking-wider text-2xs uppercase font-bold px-2.5 py-2.5">
            {subject}
          </span>
          {locked ? (
            <StatusBadge tone="error" label={status === "BANNED" ? "Banned" : "Suspended"} size="sm" />
          ) : published ? (
            <StatusBadge tone={tone} label={label} size="sm" />
          ) : (
            <span className="badge badge-warning badge-outline text-2xs font-semibold uppercase tracking-wide gap-1 py-2.5">
              <EyeOff className="h-3 w-3" />
              Unpublished
            </span>
          )}
        </div>

        <fieldset disabled={locked} className="contents">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card kt-card">
                <div className="card-body gap-4">
                  <h2 className="card-title text-sm font-bold">Class Info</h2>

                  <FormField
                    label={`Topics (${topics.length} selected)`}
                    required
                    hint="Click a topic to add or remove it. Locked topics are already used by a session."
                  >
                    <div className="flex flex-wrap gap-1.5 border border-base-300 rounded-lg bg-base-100 p-2.5">
                      {topicOptions.map((topic) => {
                        const selected = topics.includes(topic);
                        const lockedTopic = usedTopics.includes(topic);
                        return (
                          <button
                            type="button"
                            key={topic}
                            disabled={lockedTopic || locked}
                            onClick={() => toggleTopic(topic)}
                            className={`badge text-2xs font-semibold gap-1 py-2.5 transition-colors ${
                              lockedTopic
                                ? "badge-ghost text-base-content/40 cursor-not-allowed"
                                : selected
                                ? "badge-primary cursor-pointer hover:opacity-80"
                                : "badge-outline badge-primary border-dashed text-primary/70 cursor-pointer hover:bg-primary/10"
                            }`}
                          >
                            {lockedTopic ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              verifiedTopics?.includes(topic) && <BadgeCheck className="h-3 w-3" />
                            )}
                            {topic}
                            {!lockedTopic && (selected ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />)}
                          </button>
                        );
                      })}
                    </div>
                    {!locked && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomTopic();
                            }
                          }}
                          placeholder="Add another topic not listed above…"
                          maxLength={60}
                          className="input input-bordered input-xs flex-1 text-2xs focus:input-primary"
                        />
                        <button
                          type="button"
                          onClick={addCustomTopic}
                          disabled={normalizeTopic(customTopic).length < 2 || topics.length >= 10}
                          className="btn btn-outline btn-xs text-2xs"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </FormField>

                  <FormField label="Target Grade" hint="Optional — used for class matching.">
                    <select
                      value={form.gradeLevel}
                      onChange={(e) => setForm((prev) => ({ ...prev, gradeLevel: e.target.value }))}
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

                  <FormField label="Location" hint="Optional — for an in-person class">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <input
                        type="text"
                        value={form.building}
                        onChange={(e) => setForm((prev) => ({ ...prev, building: e.target.value }))}
                        placeholder="Building"
                        className="input input-bordered input-sm w-full focus:input-primary text-xs"
                      />
                      <input
                        type="text"
                        value={form.room}
                        onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
                        placeholder="Room"
                        className="input input-bordered input-sm w-32 shrink-0 focus:input-primary text-xs"
                      />
                    </div>
                  </FormField>

                  <FormField label="Meeting Link" hint="Optional">
                    <div className="flex items-center gap-1.5">
                      <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                      <input
                        type="url"
                        value={form.meetingLink}
                        onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                        placeholder="https://meet.google.com/..."
                        className="input input-bordered input-sm w-full focus:input-primary text-xs"
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              <div className="card kt-card">
                <div className="card-body gap-2">
                  <h2 className="card-title text-sm font-bold">Description</h2>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Briefly explain what will be covered in this class... (optional)"
                    className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-24"
                  />
                </div>
              </div>

              <div className="card kt-card">
                <div className="card-body gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="card-title text-sm font-bold">Sessions</h2>
                    {!locked && status === "SCHEDULED" && (
                      <AddSessionModal classId={classId} classTopics={classTopics} />
                    )}
                  </div>
                  <SessionsList
                    sessions={sessions}
                    renderActions={
                      locked
                        ? undefined
                        : (s) => <SessionActions classId={classId} session={s} classTopics={classTopics} />
                    }
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="card kt-card">
                <div className="card-body gap-3">
                  <h2 className="card-title text-sm font-bold">At a Glance</h2>
                  <div className="flex items-center gap-2 text-xs text-base-content/70">
                    <Users className="h-4 w-4 text-primary shrink-0" />
                    <span>{enrolledCount} currently enrolled</span>
                  </div>
                  <label className="font-semibold text-2xs text-base-content/50">MAX CAPACITY</label>
                  <input
                    type="number"
                    value={form.maxStudents}
                    onChange={(e) => setForm((prev) => ({ ...prev, maxStudents: Number(e.target.value) }))}
                    required
                    min={Math.max(1, enrolledCount)}
                    max={10}
                    className="input input-bordered input-sm w-full focus:input-primary text-xs"
                  />
                  {enrolledCount > 0 && (
                    <p className="text-2xs text-base-content/50">
                      Can&apos;t drop below {enrolledCount} (current enrollment).
                    </p>
                  )}
                  <progress className="progress progress-primary w-full" value={fillPct} max={100}></progress>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
