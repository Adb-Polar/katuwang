"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import { BadgeCheck, Check, Lock, Plus } from "lucide-react";
import { GradeLevel } from "@prisma/client";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { GRADE_LEVELS, getEligibleTargetGrades, isTargetGradeEligibleForTutor } from "@/lib/gradeLevels";
import PageHeader from "@/components/ui/PageHeader";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import SessionsList, { SessionSummary } from "@/components/classes/SessionsList";
import SessionActions from "@/components/tutor/SessionActions";
import AddSessionModal from "@/components/tutor/AddSessionModal";
import { getClassStatusBadge, ClassLifecycleStatus } from "@/components/classes/classStatus";
import ClassModerationPanel from "@/components/classes/ClassModerationPanel";
import { subjectDisplayLabel } from "@/lib/displayLabels";

export default function EditClassForm({
  classId,
  subject,
  gradeLevel,
  tutorGradeLevel,
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
}: {
  classId: string;
  subject: string;
  gradeLevel: GradeLevel | null;
  tutorGradeLevel?: GradeLevel | string | null;
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
}) {
  const router = useRouter();
  const backHref = `/tutor/classes/${classId}`;
  const [topics, setTopics] = useState<string[]>(currentTopics);
  const [form, setForm] = useState({
    description: description ?? "",
    maxStudents,
    gradeLevel: gradeLevel ?? "",
    building: building ?? "",
    room: room ?? "",
    meetingLink: meetingLink ?? "",
  });
  const { topicsFor, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog(form.gradeLevel || undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFull = enrolledCount >= maxStudents;
  const { tone, label } = getClassStatusBadge(status, isFull, activeLabel);

  const toggleTopic = (topic: string) => {
    if (usedTopics.includes(topic)) return;
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  // Curated topics for this subject, plus any custom topics already on the class.
  const curated = topicsFor(subject);
  const topicOptions = [
    ...curated,
    ...topics.filter((t) => !curated.some((k) => k.toLowerCase() === t.toLowerCase())),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    if (locked) return;
    if (!topics.length) return reportFieldError(e.currentTarget, "Topics", "Please select at least one topic.");
    if (!form.building.trim() && !form.room.trim() && !form.meetingLink.trim()) {
      reportFieldError(e.currentTarget, "Location", "Please provide a location (building/room) or a meeting link.");
      return;
    }
    if (form.gradeLevel && tutorGradeLevel && !isTargetGradeEligibleForTutor(form.gradeLevel, tutorGradeLevel)) {
      setError("Target grade cannot be higher than your current grade level.");
      return;
    }
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
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Failed to update class.");
      router.push(backHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class.");
    } finally {
      setLoading(false);
    }
  };

  const statusLine = locked
    ? <span className="text-error font-medium">{status === "BANNED" ? "Banned" : "Suspended"}, so it can&apos;t be edited</span>
    : !published
    ? <span className="text-base-content font-medium">Unpublished: learners can&apos;t see it yet</span>
    : <span className={`font-medium ${tone === "success" ? "text-success" : "text-base-content"}`}>{label}</span>;

  return (
    <div className="space-y-6 max-w-3xl">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <div className="space-y-3">
        <BackLink href={backHref}>Back to class</BackLink>
        <PageHeader
          eyebrow="Edit class"
          title={subjectDisplayLabel(subject)}
          subtitle={<>{statusLine} · {enrolledCount} of {maxStudents} enrolled</>}
          actions={
            <>
              <Link href={backHref} className="btn btn-ghost">
                {locked ? "Back" : "Cancel"}
              </Link>
              {!locked && (
                <button type="submit" form="edit-class-form" disabled={loading} className="btn btn-primary">
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : "Save changes"}
                </button>
              )}
            </>
          }
        />
      </div>

      {locked && (status === "SUSPENDED" || status === "BANNED") && (
        <div className="space-y-2">
          <ClassModerationPanel
            status={status}
            suspendedReason={suspendedReason}
            suspendedUntil={suspendedUntil}
            audience="tutor"
          />
          <p className="text-sm">
            To appeal, go back to the{" "}
            <Link href={backHref} className="link link-primary">class page</Link>.
          </p>
        </div>
      )}

      <FeedbackBanner variant="error" message={error || null} />

      <ValidatedForm id="edit-class-form" onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={locked} className="contents">
          <div className="space-y-6">
          <section aria-labelledby="edit-details" className="card kt-card">
            <div className="kt-card-body gap-5">
              <h2 id="edit-details" className={sectionTitle}>Details</h2>

              <FormField
                size="md"
                label={`Topics (${topics.length} selected)`}
                required
                hint="Tap a topic to add or remove it. Topics with a lock already have a session."
              >
                <div className="flex flex-wrap gap-2">
                  {topicOptions.map((topic) => {
                    const selected = topics.includes(topic);
                    const lockedTopic = usedTopics.includes(topic);
                    return (
                      <button
                        type="button"
                        key={topic}
                        aria-pressed={selected}
                        disabled={lockedTopic || locked}
                        onClick={() => toggleTopic(topic)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-left transition-colors ${
                          lockedTopic
                            ? "border-(--kt-border) bg-base-200 text-base-content cursor-not-allowed"
                            : selected
                            ? "border-primary bg-primary text-primary-content hover:opacity-90"
                            : "border-(--kt-border) text-base-content hover:border-primary"
                        }`}
                      >
                        {lockedTopic ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-(--kt-muted)" aria-label="has a session" />
                        ) : selected ? (
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 shrink-0 text-(--kt-muted)" aria-hidden="true" />
                        )}
                        {topic}
                        {verifiedTopics?.includes(topic) && (
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-label="you're certified" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField size="md" label="Target grade" hint="Optional. Used to match the class to learners.">
                <select
                  value={form.gradeLevel}
                  onChange={(e) => setForm((prev) => ({ ...prev, gradeLevel: e.target.value }))}
                  className="select select-bordered w-full"
                >
                  <option value="">Any grade</option>
                  {(tutorGradeLevel ? getEligibleTargetGrades(tutorGradeLevel) : GRADE_LEVELS).map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField size="md" label="Location" hint="Building and room for an in-person class.">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Building"
                    value={form.building}
                    onChange={(e) => setForm((prev) => ({ ...prev, building: e.target.value }))}
                    placeholder="Building"
                    className="input input-bordered w-full min-w-0"
                  />
                  <input
                    type="text"
                    aria-label="Room"
                    value={form.room}
                    onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
                    placeholder="Room"
                    className="input input-bordered w-28 shrink-0"
                  />
                </div>
              </FormField>

              <FormField size="md" label="Meeting link" hint="Needed if there's no building or room.">
                <input
                  type="url"
                  aria-label="Meeting link"
                  value={form.meetingLink}
                  onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="input input-bordered w-full"
                />
              </FormField>

              <FormField
                size="md"
                label="Class size"
                hint={enrolledCount > 0 ? `Up to 10. ${enrolledCount} enrolled now, so it can't go below that.` : "Up to 10 learners."}
              >
                <input
                  id="class-max-capacity"
                  type="number"
                  value={form.maxStudents}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxStudents: Number(e.target.value) }))}
                  required
                  min={Math.max(1, enrolledCount)}
                  max={10}
                  className="input input-bordered w-28"
                />
              </FormField>

              <FormField size="md" label="Description" hint="Optional. What the class will cover.">
                <textarea
                  aria-label="Class description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={500}
                  rows={4}
                  className="textarea textarea-bordered w-full"
                />
                <CharCount value={form.description} max={500} />
              </FormField>
            </div>
          </section>

          <section aria-labelledby="edit-sessions" className="card kt-card">
            <div className="kt-card-body gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="edit-sessions" className={sectionTitle}>Sessions</h2>
                {!locked && status === "SCHEDULED" && (
                  <AddSessionModal classId={classId} classTopics={classTopics} />
                )}
              </div>
              <SessionsList
                variant="calendar"
                sessions={sessions}
                renderActions={
                  locked
                    ? undefined
                    : (s) => <SessionActions classId={classId} session={s} classTopics={classTopics} />
                }
              />
            </div>
          </section>
          </div>
        </fieldset>
      </ValidatedForm>
    </div>
  );
}

const sectionTitle = "font-serif text-2xl font-medium leading-tight";
