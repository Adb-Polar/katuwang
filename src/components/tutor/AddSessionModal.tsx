"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";

export default function AddSessionModal({ classId, classTopics }: { classId: string; classTopics: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState(classTopics[0] ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, scheduledAt: new Date(scheduledAt).toISOString(), duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add session.");
      setIsOpen(false);
      setScheduledAt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary btn-sm text-xs gap-1 cursor-pointer">
        <Plus className="h-3.5 w-3.5" />
        Add Session
      </button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-4">Add a Session</h3>

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
                  onClick={() => setIsOpen(false)}
                  className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm text-xs cursor-pointer">
                  {loading ? <span className="loading loading-spinner loading-xs"></span> : "Add Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
