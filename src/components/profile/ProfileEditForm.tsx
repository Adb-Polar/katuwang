"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { normalizeContactInfo } from "@/lib/contactInfo";

export default function ProfileEditForm({
  endpoint,
  initialContactInfo,
  initialSection,
  initialGradeLevel,
}: {
  /** PATCH endpoint that accepts `{ contactInfo?, section?, gradeLevel? }` — e.g. "/api/learner/profile". */
  endpoint: string;
  initialContactInfo: string;
  initialSection: string;
  initialGradeLevel: string;
}) {
  const router = useRouter();
  const [contactInfo, setContactInfo] = useState(initialContactInfo);
  const [section, setSection] = useState(initialSection);
  const [gradeLevel, setGradeLevel] = useState(initialGradeLevel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [contactError, setContactError] = useState("");
  const [success, setSuccess] = useState("");

  // Only phone characters (digits / spaces / + ( ) . -) are accepted at all —
  // anything else is stripped as the user types.
  const sanitizeContactInput = (next: string) => next.replace(/[^\d\s()+.-]/g, "");

  const validateContactLive = (next: string) => {
    if (!next.trim()) {
      setContactError("");
      return;
    }
    const check = normalizeContactInfo(next);
    setContactError(check.ok ? "" : check.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    setError("");
    setSuccess("");

    const contactCheck = normalizeContactInfo(contactInfo);
    if (!contactCheck.ok) {
      setContactError("");
      reportFieldError(e.currentTarget, "Contact info", contactCheck.error);
      return;
    }
    setContactError("");

    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactInfo, section, gradeLevel }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      setContactInfo(data.contactInfo ?? "");
      setSection(data.section ?? "");
      if (data.gradeLevel) setGradeLevel(data.gradeLevel);
      setSuccess("Profile updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ValidatedForm onSubmit={handleSubmit} className="space-y-5">
      <FeedbackBanner variant="error" message={error || null} />
      <FeedbackBanner variant="success" message={success || null} />

      <div className="grid gap-4 sm:grid-cols-2">
      <FormField size="md" label="Grade level" required>
        <select
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
          className="select select-bordered w-full"
          required
        >
          <option value="" disabled>
            Select grade
          </option>
          {GRADE_LEVELS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField size="md" label="Section" required>
        <input
          type="text"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="input input-bordered w-full"
          maxLength={50}
          required
        />
      </FormField>
      </div>

      <FormField
        size="md"
        label="Contact info"
        hint="A Philippine mobile number, e.g. 0917 123 4567."
        error={contactError || undefined}
       
      >
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={contactInfo}
          onChange={(e) => {
            const next = sanitizeContactInput(e.target.value);
            setContactInfo(next);
            validateContactLive(next);
          }}
          className="input input-bordered w-full"
          placeholder="0917 123 4567"
        />
      </FormField>

      <div>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <span className="loading loading-spinner loading-sm"></span> : "Save changes"}
        </button>
      </div>
    </ValidatedForm>
  );
}
