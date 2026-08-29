"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

interface TutorClassOption {
  id: string;
  subject: string;
  topics: string[];
  sessions: { scheduledAt: string; status: string }[];
  maxStudents: number;
  enrollments: { id: string }[];
}

export default function FulfillRequestModal({
  requestId,
  subject,
  onClose,
  onFulfilled,
}: {
  requestId: string;
  subject: string;
  onClose: () => void;
  onFulfilled: () => void;
}) {
  const [classes, setClasses] = useState<TutorClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tutor/classes?status=SCHEDULED");
        if (!res.ok) throw new Error("Could not load your classes.");
        const json: TutorClassOption[] = await res.json();
        if (!cancelled) setClasses(json.filter((c) => c.subject === subject));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your classes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subject]);

  const submit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/topic-requests/${requestId}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not attach the class.");
      onFulfilled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not attach the class.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md p-6 bg-base-100 border border-base-200 rounded-2xl shadow-xl">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
          ✕
        </button>
        <h3 className="font-serif text-base font-semibold mb-1">Offer a class</h3>
        <p className="text-xs text-base-content/60 mb-4">
          Attach one of your scheduled {subject} classes. The learner reviews it and enrolls themselves.
        </p>

        <FeedbackBanner variant="error" message={error || null} />

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-base-content/50 italic">
              You have no scheduled {subject} class to attach.
            </p>
            <Link href="/tutor/classes" className="btn btn-primary btn-xs text-xs">
              Create a class
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {classes.map((c) => {
              const next = c.sessions
                .filter((s) => s.status === "SCHEDULED")
                .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0];
              return (
                <label
                  key={c.id}
                  className={`flex items-start gap-2 border rounded-lg p-3 cursor-pointer text-xs ${
                    selectedId === c.id ? "border-primary bg-primary/5" : "border-base-200 hover:bg-base-200/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfill-class"
                    className="radio radio-xs radio-primary mt-0.5"
                    checked={selectedId === c.id}
                    onChange={() => setSelectedId(c.id)}
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {c.topics.map((t) => (
                        <span key={t} className="badge badge-outline badge-sm text-2xs">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-2xs text-base-content/60">
                      <CalendarClock className="h-3 w-3" />
                      {next
                        ? new Date(next.scheduledAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "No upcoming session"}
                      {" · "}
                      {c.enrollments.length}/{c.maxStudents} enrolled
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="modal-action pt-4">
          <button onClick={onClose} className="btn btn-neutral btn-outline btn-sm text-xs">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!selectedId || submitting}
            className="btn btn-primary btn-sm text-xs"
          >
            {submitting ? <span className="loading loading-spinner loading-xs" /> : "Attach class"}
          </button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
}
