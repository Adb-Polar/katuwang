"use client";

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
    e.preventDefault();
    setError("");
    setSuccess("");

    const contactCheck = normalizeContactInfo(contactInfo);
    if (!contactCheck.ok) {
      setContactError(contactCheck.error);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />
      <FeedbackBanner variant="success" message={success || null} />

      <FormField label="Grade level" required hint="Your current grade level." orientation="horizontal">
        <select
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
          className="select select-bordered select-md text-sm w-full"
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

      <FormField label="Section" required hint="Your current class section." orientation="horizontal">
        <input
          type="text"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="input input-bordered input-md text-sm w-full"
          maxLength={50}
          required
        />
      </FormField>

      <FormField
        label="Contact info"
        hint="A Philippine mobile number, e.g. 0917 123 4567. Visible only to you and admins."
        error={contactError || undefined}
        orientation="horizontal"
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
          className="input input-bordered input-md text-sm w-full"
          placeholder="0917 123 4567"
        />
      </FormField>

      <div className="pt-1">
        <button type="submit" disabled={saving} className="btn btn-primary btn-md text-sm font-bold cursor-pointer">
          {saving ? <span className="loading loading-spinner loading-sm"></span> : "Save changes"}
        </button>
      </div>
    </form>
  );
}
