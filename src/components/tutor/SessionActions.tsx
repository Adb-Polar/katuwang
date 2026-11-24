"use client";

import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, Pencil } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RescheduleSessionModal from "@/components/tutor/RescheduleSessionModal";
import { SessionSummary } from "@/components/classes/SessionsList";

type PendingAction = "cancel" | "complete" | "delete" | null;

const SUCCESS_MESSAGES: Record<NonNullable<PendingAction>, string> = {
  cancel: "Session cancelled.",
  complete: "Session marked as completed.",
  delete: "Session deleted.",
};

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
      toast.success(SUCCESS_MESSAGES[pendingAction]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      {error && <span className="text-2xs text-error">{error}</span>}

      {session.status === "SCHEDULED" && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsRescheduling(true)}
            className="btn btn-ghost btn-xs cursor-pointer tooltip"
            data-tip="Reschedule"
            aria-label="Reschedule session"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("complete")}
            className="btn btn-ghost btn-xs text-success cursor-pointer tooltip"
            data-tip="Mark complete"
            aria-label="Mark session complete"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("cancel")}
            className="btn btn-ghost btn-xs text-error cursor-pointer tooltip"
            data-tip="Cancel"
            aria-label="Cancel session"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
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
        <RescheduleSessionModal
          sessionUrl={sessionUrl}
          session={session}
          classTopics={classTopics}
          onClose={() => setIsRescheduling(false)}
        />
      )}
    </>
  );
}
