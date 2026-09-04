"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel } from "lucide-react";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export interface ClassAppealSummary {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Shown under `ClassModerationPanel` on a suspended/banned class. Lets the
 * tutor file one appeal at a time and shows the status of the latest one.
 */
export default function ClassAppealCard({
  classId,
  appeal,
}: {
  classId: string;
  appeal: ClassAppealSummary | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit the appeal.");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the appeal.");
    } finally {
      setSaving(false);
    }
  };

  if (appeal?.status === "PENDING") {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-warning">
          <Gavel className="h-4 w-4 shrink-0" />
          Appeal submitted — awaiting admin review
        </div>
        <p className="text-base-content/70">Filed {fmt(appeal.createdAt)}.</p>
        <p className="text-base-content/80">
          <span className="font-semibold">Your reason:</span> {appeal.reason}
        </p>
      </div>
    );
  }

  const wasRejected = appeal?.status === "REJECTED";

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-4 text-xs space-y-2">
      {wasRejected && (
        <div className="space-y-1">
          <p className="font-bold text-error">Your last appeal was not approved</p>
          {appeal?.reviewNote && (
            <p className="text-base-content/80">
              <span className="font-semibold">Admin note:</span> {appeal.reviewNote}
            </p>
          )}
        </div>
      )}

      {open ? (
        <div className="space-y-2">
          <FeedbackBanner variant="error" message={error || null} />
          <FormField label="Why should this moderation be lifted?" required>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Explain your side. An admin will review it."
              className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-24"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-neutral btn-outline btn-xs text-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving || reason.trim().length < 10}
              className="btn btn-primary btn-xs text-2xs"
            >
              {saving ? <span className="loading loading-spinner loading-xs" /> : "Submit appeal"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-base-content/70">
            Think this was a mistake? You can appeal it to an administrator.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-outline btn-primary btn-xs text-2xs shrink-0"
          >
            <Gavel className="h-3.5 w-3.5" />
            {wasRejected ? "Appeal again" : "Appeal this decision"}
          </button>
        </div>
      )}
    </div>
  );
}
