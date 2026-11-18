"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useFetchList } from "@/hooks/useFetchList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import { formatDateTime } from "@/lib/datetime";
import { SlotDate, slotLabel, slotRange } from "@/components/requests/requestSlots";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadErrorState from "@/components/ui/LoadErrorState";
import MatchCriteriaFields, {
  MatchCriteriaValue,
  PreferredSlot,
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
  expiresAt: string;
  lastSubmittedAt: string;
  topics: string[];
  slots: { date?: string | null; day: string; startTime: string; endTime: string }[];
  directedTo: { anonymousId: string } | null;
  fulfilledClass: { id: string; subject: string; topics: string[]; nextSessionAt: string | null; tutorAnonymousId: string } | null;
}

const STATUS_TONE = {
  OPEN: { text: "text-(--kt-muted)", label: "Waiting for a tutor" },
  ACCEPTED: { text: "text-success", label: "Class created" },
  ENROLLED: { text: "text-success", label: "Enrolled" },
  FULFILLED: { text: "text-(--kt-muted)", label: "Completed" },
  CANCELLED: { text: "text-(--kt-muted)", label: "Cancelled" },
} as const;

/** "in 6 h" when an open request closes within a day; otherwise null (the deadline is the same 3-day window for all). */
function closesSoon(r: { status: string; expiresAt: string }): string | null {
  if (r.status !== "OPEN") return null;
  const hours = (new Date(r.expiresAt).getTime() - Date.now()) / 3_600_000;
  if (hours <= 0 || hours > 24) return null;
  return hours < 1 ? "within the hour" : `in ${Math.round(hours)} h`;
}

export default function TopicRequestManager({ defaultGrade }: { defaultGrade: string }) {
  const { data: requests, loading, error, loadError, setError, refetch } = useFetchList<TopicRequest>(
    "/api/learner/topic-requests",
    "Could not load your requests."
  );

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"Active" | "Expired" | "Past">("Active");
  const [renewId, setRenewId] = useState<string | null>(null);
  const [renewSlots, setRenewSlots] = useState<PreferredSlot[]>([]);
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
    const validationForm = e.currentTarget;
    e.preventDefault();
    setError("");
    if (!editCriteria.subject) return reportFieldError(e.currentTarget, "Subject", "Please choose a subject.");
    if (editCriteria.topics.length === 0) return reportFieldError(e.currentTarget, "Topics", "Please choose at least one topic.");
    if (!editCriteria.gradeLevel) return reportFieldError(e.currentTarget, "Grade level", "Please choose a grade level.");

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/learner/topic-requests/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteriaToBody(editCriteria), note: editNote }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
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

  const renew = async (id: string, slots?: PreferredSlot[]) => {
    setError("");
    try {
      const res = await fetch(`/api/learner/topic-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "RENEW", ...(slots ? { preferredSlots: slots } : {}) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not renew request.");
      setRenewId(null);
      setTab("Active");
      refetch();
      setSuccess("Request renewed for 3 days.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not renew request."); }
  };
  const visibleRequests = requests.filter((r) => tab === "Past" ? r.status !== "OPEN" :
    r.status === "OPEN" && (tab === "Expired" ? new Date(r.expiresAt) <= new Date() : new Date(r.expiresAt) > new Date()))
    .sort((a, b) => new Date(b.lastSubmittedAt).getTime() - new Date(a.lastSubmittedAt).getTime());

  const editingRequest = editId ? requests.find((r) => r.id === editId) ?? null : null;
  // Adding or editing takes over the panel — the list and the "New request"
  // button are hidden until the learner is done.
  const formMode = showForm || editId !== null;

  const submit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    setError("");
    if (!criteria.subject) return reportFieldError(e.currentTarget, "Subject", "Please choose a subject.");
    if (criteria.topics.length === 0) return reportFieldError(e.currentTarget, "Topics", "Please choose at least one topic.");
    if (!criteria.gradeLevel) return reportFieldError(e.currentTarget, "Grade level", "Please choose a grade level.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/learner/topic-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteriaToBody(criteria), note }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
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

  const tabCount = (name: "Active" | "Expired" | "Past") =>
    requests.filter((r) => name === "Past" ? r.status !== "OPEN" :
      r.status === "OPEN" && (name === "Expired" ? new Date(r.expiresAt) <= new Date() : new Date(r.expiresAt) > new Date())).length;
  const textarea = "textarea textarea-bordered w-full min-h-24";

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={loadError ? null : error || null} />

      <section className="card kt-card">
        <div className="kt-card-body gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="font-serif text-2xl font-medium leading-tight">
                {editId ? "Edit your request" : showForm ? "Ask for a class" : renewId ? "Renew your request" : "Your requests"}
              </h2>
              {!formMode && !renewId && (
                <p className="text-sm text-(--kt-muted)">
                  Say what you want to learn and when you&apos;re free. A tutor can make a class for it, then you review and enroll.
                  Need something now? Try <Link href="/learner/match" className="link link-primary">Auto match</Link>.
                </p>
              )}
            </div>
            {!formMode && !renewId && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setError("");
                }}
                className="btn btn-primary gap-1.5"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                New request
              </button>
            )}
          </div>

          {showForm && (
            <ValidatedForm onSubmit={submit} className="space-y-6">
              <MatchCriteriaFields gradeLocked gradeRequired value={criteria} onChange={setCriteria} />
              <FormField size="md" label="Note" hint="Optional — anything a tutor should know.">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  className={textarea}
                  placeholder="e.g. I struggle with word problems the most."
                />
                <CharCount value={note} max={500} />
              </FormField>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting && <span className="loading loading-spinner loading-sm" />}
                  Post request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setError("");
                  }}
                  className="btn btn-ghost"
                >
                  Back to requests
                </button>
              </div>
            </ValidatedForm>
          )}

          {editingRequest && (
            <ValidatedForm onSubmit={saveEdit} className="space-y-6">
              <p className="text-sm text-(--kt-muted)">
                {subjectDisplayLabel(editingRequest.subject)} · still open, so you can change it.
              </p>
              <MatchCriteriaFields gradeLocked gradeRequired value={editCriteria} onChange={setEditCriteria} />
              <FormField size="md" label="Note" hint="Optional — anything a tutor should know.">
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className={textarea}
                  placeholder="e.g. I struggle with word problems the most."
                />
              </FormField>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={savingEdit} className="btn btn-primary">
                  {savingEdit && <span className="loading loading-spinner loading-sm" />}
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setError("");
                  }}
                  className="btn btn-ghost"
                >
                  Back to requests
                </button>
              </div>
            </ValidatedForm>
          )}

          {renewId && (
            <div className="space-y-4">
              <p className="text-sm text-(--kt-muted)">Adjust the weekly times you&apos;re free, then renew the request for 3 more days.</p>
              <ul className="border-t border-(--kt-border)">
                {renewSlots.map((slot, i) => (
                  <li key={i} className="grid grid-cols-2 sm:grid-cols-[3fr_2fr_2fr_auto] items-end gap-3 py-3 border-b border-(--kt-border)">
                    <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                      <span className="text-sm text-(--kt-muted)">Day</span>
                      <select className="select select-bordered w-full" value={slot.day} onChange={(e) => setRenewSlots(renewSlots.map((s, j) => j === i ? { ...s, day: e.target.value } : s))}>
                        {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((d) => <option key={d} value={d}>Every {d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
                      </select>
                    </label>
                    <label className="min-w-0 flex flex-col gap-1">
                      <span className="text-sm text-(--kt-muted)">From</span>
                      <input type="time" className="input input-bordered w-full" value={slot.startTime} onChange={(e) => setRenewSlots(renewSlots.map((s, j) => j === i ? { ...s, startTime: e.target.value } : s))} />
                    </label>
                    <label className="min-w-0 flex flex-col gap-1">
                      <span className="text-sm text-(--kt-muted)">To</span>
                      <input type="time" className="input input-bordered w-full" value={slot.endTime} onChange={(e) => setRenewSlots(renewSlots.map((s, j) => j === i ? { ...s, endTime: e.target.value } : s))} />
                    </label>
                    <button type="button" className="btn btn-ghost text-error col-span-2 sm:col-span-1 justify-self-start" onClick={() => setRenewSlots(renewSlots.filter((_, j) => j !== i))}>Remove</button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-outline gap-1.5" onClick={() => setRenewSlots([...renewSlots, { day: "MONDAY", startTime: "15:00", endTime: "17:00" }])}>
                  <Plus aria-hidden="true" className="h-4 w-4" /> Add a time
                </button>
                <button type="button" className="btn btn-primary" onClick={() => renew(renewId, renewSlots)}>Renew for 3 days</button>
                <button type="button" className="btn btn-ghost" onClick={() => setRenewId(null)}>Back to requests</button>
              </div>
            </div>
          )}

          {!formMode && !renewId && (
            <div role="tablist" aria-label="Your requests" className="flex gap-6 border-b border-(--kt-border)">
              {(["Active", "Expired", "Past"] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                  className={`-mb-px border-b-2 py-2 font-medium transition-colors ${tab === name ? "border-primary text-base-content" : "border-transparent text-(--kt-muted) hover:text-base-content"}`}
                >
                  {name} <span className="text-sm font-normal text-(--kt-muted)">{tabCount(name)}</span>
                </button>
              ))}
            </div>
          )}

          {formMode || renewId ? null : loading ? (
            <p role="status" className="text-sm text-(--kt-muted)">Loading your requests…</p>
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : visibleRequests.length === 0 ? (
            <p className="text-(--kt-muted)">
              {tab === "Active" ? "No open requests. Use New request to ask for a class on a topic." : tab === "Expired" ? "No expired requests." : "Nothing here yet — finished and cancelled requests show up here."}
            </p>
          ) : (
            <ul className="-mx-5 -mt-5">
              {visibleRequests.map((r) => {
                const meta = STATUS_TONE[r.status];
                const [first, ...more] = r.slots;
                return (
                  <li key={r.id} className="flex gap-4 px-5 py-4 border-b border-(--kt-border) last:border-b-0">
                    <SlotDate slot={first} />
                    <div className="min-w-0 flex-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="font-serif text-xl font-medium leading-snug break-words">
                          <Link href={`/learner/requests/${r.id}`} className="link link-hover">{r.topics.join(" · ")}</Link>
                        </h3>
                        <p className="text-sm text-(--kt-muted)">
                          {subjectDisplayLabel(r.subject)}
                          {first && <> · {slotRange(first)}</>}
                          {more.length > 0 && <span title={more.map(slotLabel).join("\n")}> +{more.length}</span>}
                          {r.directedTo && <> · <span className="kt-id kt-id--tutor">{r.directedTo.anonymousId}</span></>}
                          {closesSoon(r) && <span className="text-warning-content"> · closes {closesSoon(r)}</span>}
                        </p>
                        {tab === "Expired" && <p className="text-sm text-warning-content">Expired — renew it to keep looking for a tutor.</p>}
                        {r.status === "ACCEPTED" && r.fulfilledClass && (
                          <p className="text-sm text-success font-medium">
                            {r.fulfilledClass.tutorAnonymousId} made a class for this
                            {r.fulfilledClass.nextSessionAt ? <span className="font-normal">, first session {formatDateTime(r.fulfilledClass.nextSessionAt)}</span> : ""}.
                          </p>
                        )}
                        {r.status === "ENROLLED" && <p className="text-sm text-success font-medium">You&apos;re enrolled in the class for this.</p>}
                        {tab === "Past" && r.status !== "ENROLLED" && <p className="text-sm text-(--kt-muted)">{meta.label}</p>}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1 -ml-4 sm:ml-0">
                        {r.status === "ACCEPTED" && r.fulfilledClass && (
                          <Link href={`/learner/classes/${r.fulfilledClass.id}`} className="btn btn-primary ml-4 sm:ml-0">Review &amp; enroll</Link>
                        )}
                        {r.status === "ENROLLED" && r.fulfilledClass && (
                          <Link href={`/learner/classes/${r.fulfilledClass.id}`} className="btn btn-ghost">View class</Link>
                        )}
                        {tab === "Expired" && (
                          <>
                            <button className="btn btn-ghost" onClick={() => renew(r.id)}>Renew</button>
                            <button className="btn btn-ghost" onClick={() => { setRenewId(r.id); setRenewSlots(r.slots); }}>Change times</button>
                          </>
                        )}
                        {r.status === "OPEN" && tab === "Active" && (
                          <button onClick={() => startEdit(r)} className="btn btn-ghost">Edit</button>
                        )}
                        {(r.status === "OPEN" || r.status === "ACCEPTED") && (
                          <button onClick={() => setCancelId(r.id)} className="btn btn-ghost text-error">Cancel</button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
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
