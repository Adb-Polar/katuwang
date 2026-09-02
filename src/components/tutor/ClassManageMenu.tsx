"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreVertical, Pencil, Eye, EyeOff, CheckCircle, XCircle, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type PendingAction = "cancel" | "complete" | "delete" | null;

export default function ClassManageMenu({
  classId,
  status,
  published,
  hasEnrollments,
}: {
  classId: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  published: boolean;
  hasEnrollments: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setLoading(true);
    setError("");
    try {
      if (pendingAction === "delete") {
        const res = await fetch(`/api/tutor/classes/${classId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete class.");
        router.push("/tutor/classes");
        return;
      }

      const res = await fetch(`/api/tutor/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingAction === "cancel" ? "CANCELLED" : "COMPLETED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleTogglePublish = async () => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPublishing(false);
    }
  };

  const isScheduled = status === "SCHEDULED";

  return (
    <>
      {error && <span className="text-2xs text-error">{error}</span>}

      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-outline btn-sm text-xs gap-1.5 cursor-pointer">
          <MoreVertical className="h-3.5 w-3.5" />
          Manage Class
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu menu-sm bg-base-100 rounded-box z-10 w-60 p-2 shadow-lg border border-base-200 mt-2"
        >
          <li>
            <Link href={`/tutor/classes/${classId}/edit`} className="text-xs gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit Class Info
            </Link>
          </li>
          {isScheduled && (
            <li>
              <button onClick={handleTogglePublish} disabled={publishing} className="text-xs gap-2">
                {published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {published ? "Unpublish Class" : "Publish Class"}
              </button>
            </li>
          )}
          {isScheduled && (
            <>
              <div className="divider my-1"></div>
              <li>
                <button onClick={() => setPendingAction("complete")} className="text-xs gap-2 text-success">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Finish Class
                </button>
              </li>
              <li>
                <button onClick={() => setPendingAction("cancel")} className="text-xs gap-2 text-error">
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel Class
                </button>
              </li>
              {!hasEnrollments && (
                <li>
                  <button onClick={() => setPendingAction("delete")} className="text-xs gap-2 text-error">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Class
                  </button>
                </li>
              )}
            </>
          )}
        </ul>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction === "delete"
            ? "Delete this class?"
            : `Mark this class as ${pendingAction === "cancel" ? "cancelled" : "completed"}?`
        }
        description={
          pendingAction === "delete"
            ? "This cannot be undone."
            : "This will also cancel all remaining scheduled sessions in this class."
        }
        confirmLabel={pendingAction === "delete" ? "Delete" : "Confirm"}
        tone={pendingAction === "delete" || pendingAction === "cancel" ? "danger" : "default"}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
