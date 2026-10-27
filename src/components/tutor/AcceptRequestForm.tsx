"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseLocalDateAndTime } from "@/lib/datetime";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import ClassScheduleFields, { ClassScheduleSubmitPayload, SessionRowValue } from "@/components/tutor/ClassScheduleFields";

interface RequestSlot {
  date?: string | null;
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

/** Next future occurrence of `day` at `HH:MM`, formatted as `YYYY-MM-DDTHH:mm`. */
function nextOccurrence(day: string, time: string): string {
  const targetDow = WEEKDAY_INDEX[day] ?? 1;
  const now = new Date();
  const schoolDate = parseLocalDateAndTime(now).date;
  const schoolDay = new Date(`${schoolDate}T00:00:00Z`);
  let diff = (targetDow - schoolDay.getUTCDay() + 7) % 7;
  const candidate = `${schoolDate}T${time}`;
  if (diff === 0 && new Date(`${schoolDate}T${time}:00+08:00`) <= now) diff = 7;
  schoolDay.setUTCDate(schoolDay.getUTCDate() + diff);
  return diff === 0 ? candidate : `${schoolDay.toISOString().slice(0, 10)}T${time}`;
}

let rowIdCounter = 0;

/**
 * Full-page "accept a topic request & create a class" form — the page-based
 * replacement for the old `AcceptRequestModal`. Reuses `ClassScheduleFields`
 * (`variant="page"`) with the subject locked and only the tutor's certified
 * topics selectable, pre-filled from the request.
 */
export default function AcceptRequestForm({
  request,
  certifiedTopics,
  tutorGradeLevel,
}: {
  request: RequestSummary;
  /** The tutor's CERTIFIED topics within the request's subject. */
  certifiedTopics: string[];
  tutorGradeLevel?: string | null;
}) {
  const router = useRouter();
  const { topicsFor } = useSubjectCatalog();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const certifiedSet = new Set(certifiedTopics);
  const preselectedTopics = request.topics.filter((t) => certifiedSet.has(t));
  const disabledTopics = topicsFor(request.subject).filter((t) => !certifiedSet.has(t));

  const firstSlot = request.slots[0];
  const nextOccur = firstSlot ? (firstSlot.date ? `${firstSlot.date}T${firstSlot.startTime}` : nextOccurrence(firstSlot.day, firstSlot.startTime)) : null;
  const initialSessionRows: SessionRowValue[] = firstSlot && nextOccur
    ? [
        {
          key: `accept-row-${++rowIdCounter}`,
          topic: preselectedTopics[0] ?? "",
          scheduledAt: nextOccur,
          date: nextOccur.split("T")[0],
          time: nextOccur.split("T")[1],
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
      router.push(`/tutor/classes/${data.classId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept this request.");
      setSubmitting(false);
    }
  };

  return (
    <section className="card kt-card">
      <div className="card-body gap-4 p-6 sm:p-8">
        <p className="text-xs text-base-content/60">
          This creates a full class from the {subjectDisplayLabel(request.subject)} request. Only topics you&apos;re certified for can be
          selected.
        </p>

        {certifiedTopics.length === 0 && (
          <div className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg p-3">
            You have no certified topics in {subjectDisplayLabel(request.subject)} yet — request an assessment first.
          </div>
        )}

        <ClassScheduleFields
          variant="page"
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
          tutorGradeLevel={tutorGradeLevel}
          submitLabel="Accept & create class"
          submitting={submitting}
          error={error}
          onCancel={() => router.push("/tutor/requests")}
          onSubmit={submit}
        />
      </div>
    </section>
  );
}
