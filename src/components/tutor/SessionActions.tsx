"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, Pencil } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SessionSummary } from "@/components/classes/SessionsList";

type PendingAction = "cancel" | "complete" | "delete" | null;

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function SessionActions({
  classId,
  session,
  classTopics,
}: {
  classId: string;
  session: SessionSummary;
  classTopics: string[];
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [topic, setTopic] = useState(session.topic);
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(session.scheduledAt));
  const [duration, setDuration] = useState(session.duration);
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const sessionUrl = `/api/tutor/classes/${classId}/sessions/${session.id}`;

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setLoading(true);
    setError("");
    try {
      if (pendingAction === "delete") {
        const res = await fetch(sessionUrl, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete session.");
      } else {
        const res = await fetch(sessionUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: pendingAction === "cancel" ? "CANCELLED" : "COMPLETED" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update session.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduling(true);
    setRescheduleError("");
    try {
      const res = await fetch(sessionUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, scheduledAt: new Date(scheduledAt).toISOString(), duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule session.");
      setIsRescheduling(false);
      router.refresh();
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Failed to reschedule session.");
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <>
      {error && <span className="text-2xs text-error">{error}</span>}

      {session.status === "SCHEDULED" && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsRescheduling(true)}
            className="btn btn-ghost btn-xs cursor-pointer tooltip"
            data-tip="Reschedule"
            aria-label="Reschedule session"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPendingAction("complete")}
            className="btn btn-ghost btn-xs text-success cursor-pointer tooltip"
            data-tip="Mark complete"
            aria-label="Mark session complete"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPendingAction("cancel")}
            className="btn btn-ghost btn-xs text-error cursor-pointer tooltip"
            data-tip="Cancel"
            aria-label="Cancel session"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPendingAction("delete")}
            className="btn btn-ghost btn-xs text-error cursor-pointer tooltip"
            data-tip="Delete"
            aria-label="Delete session"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction === "delete"
            ? "Delete this session?"
            : `Mark this session as ${pendingAction === "cancel" ? "cancelled" : "completed"}?`
        }
        description={pendingAction === "delete" ? "This cannot be undone." : undefined}
        confirmLabel={pendingAction === "delete" ? "Delete" : "Confirm"}
        tone={pendingAction === "delete" || pendingAction === "cancel" ? "danger" : "default"}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      {isRescheduling && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setIsRescheduling(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-4">Reschedule Session</h3>

            <FeedbackBanner variant="error" message={rescheduleError || null} />

            <form onSubmit={handleReschedule} className="space-y-3.5 mt-3.5">
              <FormField label="Topic" required>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="select select-bordered select-sm w-full text-xs"
                >
                  {classTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Date & Time" required>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="input input-bordered input-sm w-full text-xs"
                />
              </FormField>

              <FormField label="Duration" required>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                  className="select select-bordered select-sm w-full text-xs"
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins</option>
                  <option value={120}>120 mins</option>
                </select>
              </FormField>

              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={rescheduling} className="btn btn-primary btn-sm text-xs cursor-pointer">
                  {rescheduling ? <span className="loading loading-spinner loading-xs"></span> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
