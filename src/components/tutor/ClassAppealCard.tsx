"use client";

import { reportServerFieldErrors } from "@/lib/formValidation";
import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel } from "lucide-react";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import CharCount from "@/components/ui/CharCount";
import { formatDate } from "@/lib/datetime";
import { useToast } from "@/components/ui/Toast";

const REASON_MAX = 500;

export interface ClassAppealSummary {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
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
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (validationForm: HTMLFormElement) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Could not submit the appeal.");
      setOpen(false);
      setReason("");
      toast("Appeal submitted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the appeal.");
    } finally {
      setSaving(false);
    }
  };

  if (appeal?.status === "PENDING") {
    return (
      <div className="kt-card kt-card-body gap-1">
        <p className="flex items-center gap-2 font-medium">
          <Gavel className="h-4 w-4 shrink-0 text-(--kt-muted)" aria-hidden="true" />
          Appeal sent, waiting for an administrator
        </p>
        <p className="text-sm text-(--kt-muted)">Sent {formatDate(appeal.createdAt)}.</p>
        <p className="text-sm">Your reason: {appeal.reason}</p>
      </div>
    );
  }

  const wasRejected = appeal?.status === "REJECTED";

  return (
    <div className="kt-card kt-card-body gap-3">
      {wasRejected && (
        <div className="space-y-1">
          <p className="font-medium text-error">Your last appeal wasn&apos;t approved</p>
          {appeal?.reviewNote && <p className="text-sm">Administrator&apos;s note: {appeal.reviewNote}</p>}
        </div>
      )}

      {open ? (
        <ValidatedForm className="space-y-3" onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget); }}>
          <FeedbackBanner variant="error" message={error || null} />
          <FormField size="md" label="Why should this moderation be lifted?" required>
            <textarea
              required
              minLength={10}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={REASON_MAX}
              rows={4}
              placeholder="Explain your side. An administrator will review it."
              className="textarea textarea-bordered w-full"
            />
            <CharCount value={reason} max={REASON_MAX} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <span className="loading loading-spinner loading-sm" /> : "Send appeal"}
            </button>
          </div>
        </ValidatedForm>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">Think this was a mistake? You can appeal it to an administrator.</p>
          <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-primary shrink-0 gap-2">
            <Gavel className="h-4 w-4" aria-hidden="true" />
            {wasRejected ? "Appeal again" : "Appeal this decision"}
          </button>
        </div>
      )}
    </div>
  );
}
