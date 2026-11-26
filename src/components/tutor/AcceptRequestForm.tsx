"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { missingRequestedTopics } from "@/lib/requestTopicCoverage";
import { isTargetGradeEligibleForTutor } from "@/lib/gradeLevels";
import { reportServerFieldErrors } from "@/lib/formValidation";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseLocalDateAndTime } from "@/lib/datetime";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import ClassScheduleFields, { ClassScheduleSubmitPayload, SessionRowValue } from "@/components/tutor/ClassScheduleFields";
import { useToast } from "@/components/ui/Toast";

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
  const toast = useToast();
  const { topicsFor, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog(request.gradeLevel ?? undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const certifiedSet = new Set(certifiedTopics);
  const preselectedTopics = request.topics;
  const missingCertifications = request.topics.filter((t) => !certifiedSet.has(t));
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

  const submit = async (payload: ClassScheduleSubmitPayload, validationForm: HTMLFormElement) => {
    const missing = missingRequestedTopics(request.topics, payload.topics);
    if (missing.length > 0) {
      setError(`Include every requested topic. Missing: ${missing.join(", ")}.`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tutor/topic-requests/${request.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, gradeLevel: payload.gradeLevel || null }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) { setSubmitting(false); return; }
      if (!res.ok) throw new Error(data.error || "Could not accept this request.");
      toast("Request accepted and class created.", "success", { awaitNavigation: true });
      router.push(`/tutor/classes/${data.classId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept this request.");
      setSubmitting(false);
    }
  };

  return (
    <section className="card kt-card">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <div className="kt-card-body gap-5">
        {missingCertifications.length > 0 ? (
          <div role="alert" className="space-y-2">
            <p className="font-medium">You can&apos;t accept this request yet.</p>
            <p className="text-sm">
              It asks for {missingCertifications.length === 1 ? "a topic" : "topics"} you aren&apos;t certified in:{" "}
              {missingCertifications.join(", ")}.
            </p>
            <Link href="/tutor/assessments" className="btn btn-outline">Go to assessments</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-(--kt-muted)">
              The topics, first session and description are filled in from the {subjectDisplayLabel(request.subject)}{" "}
              request. Keep every requested topic; you can add sessions and change the rest.
            </p>
            <ClassScheduleFields
              variant="page"
              initial={{
                subject: request.subject,
                gradeLevel: isTargetGradeEligibleForTutor(request.gradeLevel, tutorGradeLevel) ? request.gradeLevel : "",
                description: request.note ?? "",
                topics: preselectedTopics,
                sessionRows: initialSessionRows,
              }}
              subjectLocked
              disabledTopics={disabledTopics}
              tutorGradeLevel={tutorGradeLevel}
              submitLabel="Accept & create class"
              submitting={submitting}
              error={error}
              onCancel={() => router.push("/tutor/requests")}
              onSubmit={submit}
            />
          </>
        )}
      </div>
    </section>
  );
}
