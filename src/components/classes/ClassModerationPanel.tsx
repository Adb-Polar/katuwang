import { AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/datetime";

/**
 * Error-tone panel explaining that a class is under moderation. Shared by the
 * tutor edit form (`EditClassForm`) and the learner/admin read-only detail view
 * (`ClassDetailsView`) so the wording stays in sync.
 */
export default function ClassModerationPanel({
  status,
  suspendedReason,
  suspendedUntil,
  audience = "tutor",
}: {
  status: "SUSPENDED" | "BANNED";
  suspendedReason?: string | null;
  suspendedUntil?: string | null;
  /** Tailors the explanatory line; the tutor sees an "editing is locked" note. */
  audience?: "tutor" | "learner";
}) {
  const banned = status === "BANNED";
  return (
    <div className="rounded-xl border border-error/30 bg-error/10 p-4 space-y-2">
      <div className="flex items-center gap-2 text-error font-bold text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        This class was {banned ? "banned" : "suspended"} by an administrator
      </div>
      <p className="text-xs text-base-content/70">
        {audience === "tutor"
          ? "It can't be edited and its sessions are read-only until the moderation is lifted."
          : banned
          ? "It's no longer available and enrollment is closed."
          : "It's temporarily unavailable and enrollment is frozen until the moderation is lifted."}
      </p>
      {suspendedReason && (
        <p className="text-xs text-base-content/80">
          <span className="font-semibold">Reason:</span> {suspendedReason}
        </p>
      )}
      {status === "SUSPENDED" && (
        <p className="text-xs text-base-content/80">
          <span className="font-semibold">{suspendedUntil ? "Suspended until:" : "Duration:"}</span>{" "}
          {suspendedUntil ? formatDateTime(suspendedUntil) : "Indefinite"}
        </p>
      )}
    </div>
  );
}
