"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import SessionTimeFields from "@/components/tutor/SessionTimeFields";
import { SessionSummary } from "@/components/classes/SessionsList";
import { useBusySlots } from "@/hooks/useBusySlots";
import { resolveSessionTime, sessionTimeError, sessionTimeFromRange, type SessionTimeValue } from "@/lib/sessionTime";

/**
 * Edit a scheduled session's topic and time. Mounted only while open, so the
 * tutor's busy slots are fetched on demand rather than once per session row.
 */
export default function RescheduleSessionModal({
  sessionUrl,
  session,
  classTopics,
  onClose,
}: {
  sessionUrl: string;
  session: SessionSummary;
  classTopics: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [topic, setTopic] = useState(session.topic);
  const [time, setTime] = useState<SessionTimeValue>(() => sessionTimeFromRange(session.scheduledAt, session.duration));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openedAt] = useState(() => new Date());

  // The session being edited must not count as a clash with itself.
  const busy = useBusySlots().filter((slot) => slot.id !== session.id);
  const resolved = resolveSessionTime(time);
  const timeError = sessionTimeError(time, { now: openedAt, busy });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolved || timeError) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(sessionUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, scheduledAt: resolved.scheduledAt.toISOString(), duration: resolved.duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule session.");
      toast.success("Session updated.");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule session.");
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="modal modal-open">
      <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
        >
          ✕
        </button>
        <h3 className="font-sans text-base font-semibold mb-4">Reschedule Session</h3>

        <FeedbackBanner variant="error" message={error || null} />

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3.5">
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

          <FormField label="Schedule" required>
            <SessionTimeFields value={time} onChange={setTime} error={timeError} busy={busy} />
          </FormField>

          <div className="modal-action pt-2">
            <button type="button" onClick={onClose} className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !resolved || !!timeError}
              className="btn btn-primary btn-sm text-xs cursor-pointer"
            >
              {saving ? <span className="loading loading-spinner loading-xs"></span> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
