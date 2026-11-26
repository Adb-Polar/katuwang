"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import SessionFormFields from "@/components/tutor/SessionFormFields";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SessionSummary } from "@/components/classes/SessionsList";
import { parseLocalDateAndTime, combineDateAndTime } from "@/lib/datetime";
import { useToast } from "@/components/ui/Toast";

type PendingAction = "cancel" | "complete" | "delete" | null;

const SESSION_ACTION_TOASTS = {
  cancel: "Session cancelled.",
  complete: "Session marked as completed.",
  delete: "Session deleted.",
} as const;

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
  const toast = useToast();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [topic, setTopic] = useState(session.topic);
  const initialParsed = parseLocalDateAndTime(session.scheduledAt);
  const [rescheduleDate, setRescheduleDate] = useState(initialParsed.date);
  const [rescheduleTime, setRescheduleTime] = useState(initialParsed.time);
  const [duration, setDuration] = useState(session.duration);
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const openRescheduleModal = () => {
    const parsed = parseLocalDateAndTime(session.scheduledAt);
    setTopic(session.topic);
    setRescheduleDate(parsed.date);
    setRescheduleTime(parsed.time);
    setDuration(session.duration);
    setRescheduleError("");
    setIsRescheduling(true);
  };

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
      toast(SESSION_ACTION_TOASTS[pendingAction]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    setRescheduling(true);
    setRescheduleError("");
    try {
      if (!rescheduleDate || !rescheduleTime) {
        reportFieldError(validationForm, "Date", "Please provide both a date and a start time.");
        return;
      }
      const iso = combineDateAndTime(rescheduleDate, rescheduleTime);
      if (!iso) {
        reportFieldError(validationForm, "Date", "Choose a valid date and start time.");
        return;
      }
      const res = await fetch(sessionUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, scheduledAt: iso, duration }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Failed to reschedule session.");
      setIsRescheduling(false);
      toast("Session rescheduled.");
      router.refresh();
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Failed to reschedule session.");
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <>
      {error && <p className="text-sm text-error">{error}</p>}

      {session.status === "SCHEDULED" && (
        <div className="flex min-w-0 max-w-full flex-wrap items-center -ml-2">
          <button
            type="button"
            onClick={() => setPendingAction("complete")}
            className="btn btn-ghost btn-sm px-2 text-sm font-medium text-primary"
            aria-label="Mark session as done"
          >
            Mark as done
          </button>
          <button
            type="button"
            onClick={openRescheduleModal}
            className="btn btn-ghost btn-sm px-2 text-sm font-normal"
            aria-label="Reschedule session"
          >
            Reschedule
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("cancel")}
            className="btn btn-ghost btn-sm px-2 text-sm font-normal text-error"
            aria-label="Cancel session"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("delete")}
            className="btn btn-ghost btn-sm px-2 text-sm font-normal text-error"
            aria-label="Delete session"
          >
            Delete
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction === "delete"
            ? "Delete this session?"
            : pendingAction === "complete" ? "Mark this session as done?" : "Cancel this session?"
        }
        description={pendingAction === "delete" ? "This cannot be undone." : undefined}
        confirmLabel={pendingAction === "delete" ? "Delete" : "Confirm"}
        tone={pendingAction === "delete" || pendingAction === "cancel" ? "danger" : "default"}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      <Modal portal open={isRescheduling} onClose={() => setIsRescheduling(false)} title="Reschedule session" size="md">
            <FeedbackBanner variant="error" message={rescheduleError || null} />

            <ValidatedForm onSubmit={handleReschedule} className="space-y-5 mt-4">
              <SessionFormFields topics={classTopics} topic={topic} date={rescheduleDate} time={rescheduleTime} duration={duration} excludeSessionId={session.id}
                onTopic={setTopic} onDate={setRescheduleDate} onTime={setRescheduleTime} onDuration={setDuration} />

              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={rescheduling} className="btn btn-primary">
                  {rescheduling ? <span className="loading loading-spinner loading-xs"></span> : "Save"}
                </button>
              </div>
            </ValidatedForm>
      </Modal>
    </>
  );
}
