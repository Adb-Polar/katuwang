"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Clock, X, Pencil } from "lucide-react";
import { useFetchList } from "@/hooks/useFetchList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { gradeLabel } from "@/lib/gradeLevels";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MatchCriteriaFields, {
  MatchCriteriaValue,
  EMPTY_CRITERIA,
  criteriaToBody,
} from "@/components/learner/MatchCriteriaFields";

interface TopicRequest {
  id: string;
  subject: string;
  gradeLevel: string;
  note: string | null;
  status: "OPEN" | "ACCEPTED" | "ENROLLED" | "FULFILLED" | "CANCELLED";
  createdAt: string;
  topics: string[];
  slots: { day: string; startTime: string; endTime: string }[];
  directedTo: { anonymousId: string } | null;
  fulfilledClass: { id: string; subject: string; nextSessionAt: string | null; tutorAnonymousId: string } | null;
}

const STATUS_TONE = {
  OPEN: { tone: "info", label: "Waiting for a tutor" },
  ACCEPTED: { tone: "success", label: "Class created" },
  ENROLLED: { tone: "success", label: "Enrolled" },
  FULFILLED: { tone: "neutral", label: "Completed" },
  CANCELLED: { tone: "neutral", label: "Cancelled" },
} as const;

export default function TopicRequestManager({ defaultGrade }: { defaultGrade: string }) {
  const { data: requests, loading, error, setError, refetch } = useFetchList<TopicRequest>(
    "/api/learner/topic-requests",
    "Could not load your requests."
  );

  const [showForm, setShowForm] = useState(false);
  const [criteria, setCriteria] = useState<MatchCriteriaValue>({ ...EMPTY_CRITERIA, gradeLevel: defaultGrade });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Inline edit of an existing OPEN request
  const [editId, setEditId] = useState<string | null>(null);
  const [editCriteria, setEditCriteria] = useState<MatchCriteriaValue>(EMPTY_CRITERIA);
  const [editNote, setEditNote] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const resetForm = () => {
    setCriteria({ ...EMPTY_CRITERIA, gradeLevel: defaultGrade });
    setNote("");
  };

  const startEdit = (r: TopicRequest) => {
    setError("");
    setShowForm(false);
    setEditId(r.id);
    setEditCriteria({
      subject: r.subject,
      topics: r.topics,
      gradeLevel: r.gradeLevel,
      slots: r.slots,
      classFormat: "",
    });
    setEditNote(r.note ?? "");
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!editCriteria.subject) return setError("Please choose a subject.");
    if (editCriteria.topics.length === 0) return setError("Please choose at least one topic.");
    if (!editCriteria.gradeLevel) return setError("Please choose a grade level.");

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/learner/topic-requests/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteriaToBody(editCriteria), note: editNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your changes.");
      setEditId(null);
      refetch();
      setSuccess("Request updated.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const editingRequest = editId ? requests.find((r) => r.id === editId) ?? null : null;
  // Adding or editing takes over the panel — the list and the "New request"
  // button are hidden until the learner is done.
  const formMode = showForm || editId !== null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!criteria.subject) return setError("Please choose a subject.");
    if (criteria.topics.length === 0) return setError("Please choose at least one topic.");
    if (!criteria.gradeLevel) return setError("Please choose a grade level.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/learner/topic-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteriaToBody(criteria), note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post your request.");
      setSuccess("Request posted. Tutors teaching this subject can now respond.");
      setShowForm(false);
      resetForm();
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your request.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    setError("");
    try {
      const res = await fetch(`/api/learner/topic-requests/${cancelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel the request.");
      setCancelId(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel the request.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-sm font-bold">
              {editId ? "Edit request" : showForm ? "New request" : "Your class requests"}
            </h2>
            {!formMode && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setError("");
                }}
                className="btn btn-primary btn-sm text-xs gap-1"
              >
                <Plus className="h-4 w-4" />
                New request
              </button>
            )}
          </div>

          {!formMode && (
            <p className="text-xs text-base-content/60">
              Post what you want to learn and when you&apos;re free. A tutor can attach a class, then you review and enroll.
            </p>
          )}

          {showForm && (
            <form onSubmit={submit} className="space-y-4 border border-base-200 rounded-xl p-4 bg-base-200/20">
              <MatchCriteriaFields value={criteria} onChange={setCriteria} />
              <FormField label="Note" hint="Optional — anything a tutor should know.">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  className="textarea textarea-bordered textarea-sm w-full text-xs h-16"
                  placeholder="e.g. I struggle with word problems the most."
                />
                <CharCount value={note} max={500} />
              </FormField>
              <div className="flex items-center gap-2">
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm text-xs">
                  {submitting ? <span className="loading loading-spinner loading-xs" /> : "Post request"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setError("");
                  }}
                  className="btn btn-ghost btn-sm text-xs gap-1"
                >
                  <X className="h-4 w-4" />
                  Back to requests
                </button>
              </div>
            </form>
          )}

          {editingRequest && (
            <form
              onSubmit={saveEdit}
              className="space-y-4 border border-base-200 rounded-xl p-4 bg-base-200/20"
            >
              <div className="flex items-center gap-2 text-2xs text-base-content/50">
                <span className="badge badge-neutral text-2xs font-bold uppercase">
                  {editingRequest.subject}
                </span>
                Editing your open request
              </div>
              <MatchCriteriaFields value={editCriteria} onChange={setEditCriteria} />
              <FormField label="Note" hint="Optional — anything a tutor should know.">
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="textarea textarea-bordered textarea-sm w-full text-xs h-16"
                  placeholder="e.g. I struggle with word problems the most."
                />
              </FormField>
              <div className="flex items-center gap-2">
                <button type="submit" disabled={savingEdit} className="btn btn-primary btn-sm text-xs">
                  {savingEdit ? <span className="loading loading-spinner loading-xs" /> : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setError("");
                  }}
                  className="btn btn-ghost btn-sm text-xs gap-1"
                >
                  <X className="h-4 w-4" />
                  Back to requests
                </button>
              </div>
            </form>
          )}

          {formMode ? null : loading ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 bg-base-200/10 border border-dashed border-base-300 rounded-xl text-base-content/40 italic text-xs">
              You haven&apos;t posted any requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => {
                const meta = STATUS_TONE[r.status];
                return (
                  <div key={r.id} className="border border-base-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-neutral text-2xs font-bold uppercase tracking-wide px-2 py-2">
                          {r.subject}
                        </span>
                        <span className="text-base-content/50">{gradeLabel(r.gradeLevel)}</span>
                        <StatusBadge tone={meta.tone} label={meta.label} size="xs" />
                        <span className="badge badge-outline badge-sm text-2xs">
                          {r.directedTo ? `Directed to ${r.directedTo.anonymousId}` : "Public"}
                        </span>
                      </div>
                      {(r.status === "OPEN" || r.status === "ACCEPTED") && (
                        <div className="flex items-center gap-1 shrink-0">
                          {r.status === "OPEN" && (
                            <button
                              onClick={() => startEdit(r)}
                              className="btn btn-ghost btn-xs text-2xs gap-1"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => setCancelId(r.id)}
                            className="btn btn-ghost btn-xs text-error text-2xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {r.topics.map((t) => (
                        <span key={t} className="badge badge-outline badge-sm text-2xs py-2.5">
                          {t}
                        </span>
                      ))}
                    </div>

                    {r.slots.length > 0 && (
                      <div className="flex items-center gap-1.5 text-2xs text-base-content/60 flex-wrap">
                        <Clock className="h-3 w-3 shrink-0" />
                        {r.slots.map((s, i) => (
                          <span key={i}>
                            {s.day[0] + s.day.slice(1).toLowerCase()} {s.startTime}–{s.endTime}
                            {i < r.slots.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {r.note && <p className="text-base-content/60 italic">“{r.note}”</p>}

                    {r.status === "ACCEPTED" && r.fulfilledClass && (
                      <div className="flex items-center justify-between gap-2 bg-success/5 border border-success/20 rounded-lg p-2 mt-1">
                        <span className="text-2xs text-base-content/70">
                          {r.fulfilledClass.tutorAnonymousId} created a class
                          {r.fulfilledClass.nextSessionAt
                            ? ` · next ${formatDateTime(r.fulfilledClass.nextSessionAt)}`
                            : ""}
                        </span>
                        <Link
                          href={`/learner/classes/${r.fulfilledClass.id}`}
                          className="btn btn-success btn-xs text-2xs"
                        >
                          Review &amp; enroll
                        </Link>
                      </div>
                    )}

                    {r.status === "ENROLLED" && r.fulfilledClass && (
                      <div className="flex items-center justify-between gap-2 bg-success/5 border border-success/20 rounded-lg p-2 mt-1">
                        <span className="text-2xs text-base-content/70">
                          Enrolled with {r.fulfilledClass.tutorAnonymousId} — class in progress.
                        </span>
                        <Link
                          href={`/learner/classes/${r.fulfilledClass.id}`}
                          className="btn btn-ghost btn-xs text-2xs"
                        >
                          View class
                        </Link>
                      </div>
                    )}

                    {r.status === "FULFILLED" && (
                      <p className="text-2xs text-base-content/40 italic">Completed ✓</p>
                    )}

                    <p className="text-2xs text-base-content/40">
                      Posted {formatDate(r.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={cancelId !== null}
        title="Cancel this request?"
        description="Tutors will no longer see it. You can always post a new one."
        confirmLabel="Cancel request"
        cancelLabel="Keep it"
        tone="danger"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}
