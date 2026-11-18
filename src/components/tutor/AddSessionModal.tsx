"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import SessionFormFields from "@/components/tutor/SessionFormFields";
import { combineDateAndTime } from "@/lib/datetime";

export default function AddSessionModal({ classId, classTopics }: { classId: string; classTopics: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState(classTopics[0] ?? "");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!sessionDate || !sessionTime) {
        reportFieldError(validationForm, "Date", "Please provide both a date and a start time.");
        return;
      }
      const iso = combineDateAndTime(sessionDate, sessionTime);
      if (!iso) {
        reportFieldError(validationForm, "Date", "Choose a valid date and start time.");
        return;
      }
      const res = await fetch(`/api/tutor/classes/${classId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, scheduledAt: iso, duration }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Failed to add session.");
      setIsOpen(false);
      setSessionDate("");
      setSessionTime("");
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
        className="btn btn-outline gap-1.5"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add Session
      </button>

      <Modal portal open={isOpen} onClose={() => setIsOpen(false)} title="Add a session" size="md">
            <FeedbackBanner variant="error" message={error || null} />

            <ValidatedForm onSubmit={handleSubmit} className="space-y-5 mt-4">
              <SessionFormFields topics={classTopics} topic={topic} date={sessionDate} time={sessionTime} duration={duration}
                onTopic={setTopic} onDate={setSessionDate} onTime={setSessionTime} onDuration={setDuration} />

              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? <span className="loading loading-spinner loading-xs"></span> : "Add Session"}
                </button>
              </div>
            </ValidatedForm>
      </Modal>
    </>
  );
}
