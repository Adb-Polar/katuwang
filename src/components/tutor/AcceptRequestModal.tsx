"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import ClassScheduleFields, { ClassScheduleSubmitPayload, SessionRowValue } from "@/components/tutor/ClassScheduleFields";

interface RequestSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface RequestSummary {
  id: string;
  subject: string;
  gradeLevel: string;
  note: string | null;
  topics: string[];
  slots: RequestSlot[];
}

const WEEKDAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** Next future occurrence of `day` at `HH:MM`, formatted for a `datetime-local` input. */
function nextOccurrence(day: string, time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const targetDow = WEEKDAY_INDEX[day] ?? 1;
  const now = new Date();
  const result = new Date(now);
  result.setSeconds(0, 0);
  result.setHours(hh, mm, 0, 0);

  let diff = (targetDow - now.getDay() + 7) % 7;
  if (diff === 0 && result.getTime() <= now.getTime()) diff = 7;
  result.setDate(now.getDate() + diff);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}T${pad(
    result.getHours()
  )}:${pad(result.getMinutes())}`;
}

let rowIdCounter = 0;

export default function AcceptRequestModal({
  request,
  certifiedTopics,
  onClose,
  onAccepted,
}: {
  request: RequestSummary;
  /** The tutor's CERTIFIED topics within the request's subject. */
  certifiedTopics: string[];
  onClose: () => void;
  onAccepted: () => void;
}) {
  const router = useRouter();
  const { topicsFor } = useSubjectCatalog();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const certifiedSet = new Set(certifiedTopics);
  const preselectedTopics = request.topics.filter((t) => certifiedSet.has(t));
  const disabledTopics = topicsFor(request.subject).filter((t) => !certifiedSet.has(t));

  const firstSlot = request.slots[0];
  const initialSessionRows: SessionRowValue[] = firstSlot
    ? [
        {
          key: `accept-row-${++rowIdCounter}`,
          topic: preselectedTopics[0] ?? "",
          scheduledAt: nextOccurrence(firstSlot.day, firstSlot.startTime),
          duration: 60,
        },
      ]
    : [];

  const submit = async (payload: ClassScheduleSubmitPayload) => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tutor/topic-requests/${request.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, gradeLevel: payload.gradeLevel || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not accept this request.");
      onAccepted();
      router.push(`/tutor/classes/${data.classId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept this request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
          ✕
        </button>
        <h3 className="font-serif text-base font-semibold mb-1">Accept &amp; create class</h3>
        <p className="text-xs text-base-content/60 mb-4">
          This creates a full class from the request. Only topics you&apos;re certified for can be selected.
        </p>

        {certifiedTopics.length === 0 && (
          <div className="text-2xs text-warning bg-warning/10 border border-warning/30 rounded-lg p-2 mb-3">
            You have no CERTIFIED topics in {request.subject} yet — request an assessment first.
          </div>
        )}

        <ClassScheduleFields
          initial={{
            subject: request.subject,
            gradeLevel: request.gradeLevel,
            description: request.note ?? "",
            topics: preselectedTopics,
            sessionRows: initialSessionRows,
          }}
          subjectLocked
          disabledTopics={disabledTopics}
          allowCustomTopics={false}
          submitLabel="Accept & create class"
          submitting={submitting}
          error={error}
          onCancel={onClose}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
