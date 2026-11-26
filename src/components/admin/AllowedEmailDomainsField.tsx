"use client";

import { useState } from "react";
import FormField from "@/components/ui/FormField";

/** Editor for the sign-up email allowlist. An empty list accepts every domain. */
export default function AllowedEmailDomainsField({
  value,
  onSaved,
  onError,
}: {
  value: string;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const unchanged = draft.trim() === value.trim();

  const save = async () => {
    setSaving(true);
    onError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "allowedEmailDomains", value: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update the allowed email domains.");
      setDraft(data.value);
      onSaved(data.value ? "Allowed email domains saved." : "Email domain restriction removed.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update the allowed email domains.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 py-4">
      <FormField
        size="md"
        label="Allowed email domains"
        hint="Only addresses on these domains can register or be invited as admins. Separate domains with commas, e.g. school.edu.ph, deped.gov.ph. Leave empty to accept any domain. Existing accounts are not affected."
      >
        <textarea
          rows={2}
          maxLength={4000}
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Any domain"
          className="textarea textarea-bordered w-full focus:textarea-primary"
        />
      </FormField>
      <button type="button" className="btn btn-primary self-start" disabled={saving || unchanged} onClick={save}>
        {saving ? "Saving…" : "Save domains"}
      </button>
    </div>
  );
}
