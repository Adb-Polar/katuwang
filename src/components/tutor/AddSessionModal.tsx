"use client";

import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import SessionTimeFields from "@/components/tutor/SessionTimeFields";
import { useBusySlots } from "@/hooks/useBusySlots";
import { EMPTY_SESSION_TIME, resolveSessionTime, sessionTimeError, type SessionTimeValue } from "@/lib/sessionTime";

export default function AddSessionModal({ classId, classTopics }: { classId: string; classTopics: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState(classTopics[0] ?? "");
  const [time, setTime] = useState<SessionTimeValue>(EMPTY_SESSION_TIME);
  const busy = useBusySlots();
  const [openedAt] = useState(() => new Date());
  const resolved = resolveSessionTime(time);
  const timeError = sessionTimeError(time, { now: openedAt, busy });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolved || timeError) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, scheduledAt: resolved.scheduledAt.toISOString(), duration: resolved.duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add session.");
      setIsOpen(false);
      setTime(EMPTY_SESSION_TIME);
      toast.success("Session added.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-primary btn-sm text-xs gap-1 cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Session
      </button>

      {isOpen && typeof document !== "undefined" &&
        createPortal(
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-sans text-base font-semibold mb-4">Add a Session</h3>

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
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading || !resolved || !!timeError} className="btn btn-primary btn-sm text-xs cursor-pointer">
                  {loading ? <span className="loading loading-spinner loading-xs"></span> : "Add Session"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
