"use client";

import { useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";

export default function ProfileEditForm({
  endpoint,
  initialContactInfo,
  initialSection,
}: {
  /** PATCH endpoint that accepts `{ contactInfo?, section? }` — e.g. "/api/learner/profile". */
  endpoint: string;
  initialContactInfo: string;
  initialSection: string;
}) {
  const [contactInfo, setContactInfo] = useState(initialContactInfo);
  const [section, setSection] = useState(initialSection);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactInfo, section }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      setContactInfo(data.contactInfo ?? "");
      setSection(data.section ?? "");
      setSuccess("Profile updated.");
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

      <FormField label="Section" required hint="Your current class section." orientation="horizontal">
        <input
          type="text"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="input input-bordered input-md text-sm w-full"
          required
        />
      </FormField>

      <FormField
        label="Contact Info"
        hint="Optional. Visible only to you and admins."
        orientation="horizontal"
      >
        <input
          type="text"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className="input input-bordered input-md text-sm w-full"
          placeholder="e.g. phone number or Messenger handle"
        />
      </FormField>

      <button type="submit" disabled={saving} className="btn btn-primary btn-md text-sm font-bold cursor-pointer">
        {saving ? <span className="loading loading-spinner loading-sm"></span> : "Save Changes"}
      </button>
    </form>
  );
}
