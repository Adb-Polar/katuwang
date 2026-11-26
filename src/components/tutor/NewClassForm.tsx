"use client";

import { reportServerFieldErrors } from "@/lib/formValidation";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClassScheduleFields, { ClassScheduleSubmitPayload } from "@/components/tutor/ClassScheduleFields";
import { useToast } from "@/components/ui/Toast";

/**
 * Full-page "schedule a tutoring class" form. Replaces the old cramped modal on
 * `/tutor/classes` — the form is long (subject, topics, description, a variable
 * number of session rows, location, capacity) and never fit a dialog well.
 */
export default function NewClassForm({
  allowedTopics,
  tutorGradeLevel,
}: {
  allowedTopics?: string[];
  tutorGradeLevel?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreateClass = async (payload: ClassScheduleSubmitPayload, validationForm: HTMLFormElement) => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/tutor/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, gradeLevel: payload.gradeLevel || null }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) { setSubmitting(false); return; }
      if (!res.ok) throw new Error(data.error || "Failed to create class.");

      // Land on the class we just made.
      toast("Class created.", "success", { awaitNavigation: true });
      router.push(`/tutor/classes/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setSubmitting(false);
    }
  };

  return (
    <section className="card kt-card">
      <div className="kt-card-body gap-4 sm:p-8">
        <ClassScheduleFields
          variant="page"
          submitLabel="Schedule class"
          submitting={submitting}
          error={error}
          allowedTopics={allowedTopics}
          tutorGradeLevel={tutorGradeLevel}
          onCancel={() => router.push("/tutor/classes")}
          onSubmit={handleCreateClass}
        />
      </div>
    </section>
  );
}
