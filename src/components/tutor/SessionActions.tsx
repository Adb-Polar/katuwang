"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, Pencil } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import SessionFormFields from "@/components/tutor/SessionFormFields";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SessionSummary } from "@/components/classes/SessionsList";
import { parseLocalDateAndTime, combineDateAndTime } from "@/lib/datetime";

type PendingAction = "cancel" | "complete" | "delete" | null;

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
            type="button"
            onClick={openRescheduleModal}
            className="btn btn-ghost btn-xs min-h-11 sm:min-h-0 cursor-pointer tooltip"
            data-tip="Reschedule"
            aria-label="Reschedule session"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("complete")}
            className="btn btn-outline btn-success btn-xs min-h-11 sm:min-h-0 cursor-pointer gap-1"
            aria-label="Finish session"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Finish session
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("cancel")}
            className="btn btn-ghost btn-xs min-h-11 sm:min-h-0 text-error cursor-pointer tooltip"
            data-tip="Cancel"
            aria-label="Cancel session"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("delete")}
            className="btn btn-ghost btn-xs min-h-11 sm:min-h-0 text-error cursor-pointer tooltip"
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
            : pendingAction === "complete" ? "Finish this session?" : "Cancel this session?"
        }
        description={pendingAction === "delete" ? "This cannot be undone." : undefined}
        confirmLabel={pendingAction === "delete" ? "Delete" : "Confirm"}
        tone={pendingAction === "delete" || pendingAction === "cancel" ? "danger" : "default"}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      <Modal open={isRescheduling} onClose={() => setIsRescheduling(false)} title="Reschedule Session" size="md">
            <FeedbackBanner variant="error" message={rescheduleError || null} />

            <ValidatedForm onSubmit={handleReschedule} className="space-y-5 mt-4">
              <SessionFormFields topics={classTopics} topic={topic} date={rescheduleDate} time={rescheduleTime} duration={duration}
                onTopic={setTopic} onDate={setRescheduleDate} onTime={setRescheduleTime} onDuration={setDuration} />

              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="btn btn-neutral btn-outline min-h-11 text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={rescheduling} className="btn btn-primary min-h-11 text-sm cursor-pointer">
                  {rescheduling ? <span className="loading loading-spinner loading-xs"></span> : "Save"}
                </button>
              </div>
            </ValidatedForm>
      </Modal>
    </>
  );
}
