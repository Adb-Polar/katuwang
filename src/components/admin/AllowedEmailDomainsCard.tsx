"use client";

import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { isValidDomain, parseDomainList } from "@/lib/emailDomains";

const ENDPOINT = "/api/admin/settings/email-domains";

/** Admin editor for the email domains that registration accepts. */
export default function AllowedEmailDomainsCard() {
  const toast = useToast();
  const [saved, setSaved] = useState<string[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(ENDPOINT)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load the accepted email domains."))))
      .then((data: { domains: string[] }) => {
        if (cancelled) return;
        setSaved(data.domains);
        setDraft(data.domains.join("\n"));
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const domains = parseDomainList(draft);
  const invalidDomains = domains.filter((domain) => !isValidDomain(domain));
  const unchanged = saved !== null && domains.join(",") === saved.join(",");
  const draftError =
    invalidDomains.length > 0
      ? `Not a valid domain: ${invalidDomains.join(", ")}`
      : domains.length === 0
        ? "Keep at least one accepted domain."
        : undefined;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the accepted email domains.");
      setSaved(data.domains);
      setDraft(data.domains.join("\n"));
      toast.success("Accepted email domains saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the accepted email domains.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card kt-card">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title text-sm font-bold">Accepted email domains</h2>
          <p className="text-2xs text-base-content/60 mt-1">
            New accounts can only register with an email address from one of these domains. Existing accounts are not
            affected.
          </p>
        </div>
        <FeedbackBanner variant="error" message={error || null} />
        <FormField label="Domains" required hint="One per line, e.g. school.edu.ph" error={draftError}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saved === null || saving}
            rows={4}
            spellCheck={false}
            className="textarea textarea-bordered textarea-sm w-full max-w-md font-mono text-xs focus:textarea-primary"
          />
        </FormField>
        <div>
          <button
            type="button"
            onClick={save}
            disabled={saved === null || saving || unchanged || draftError !== undefined}
            className="btn btn-primary btn-sm text-xs"
          >
            {saving && <span className="loading loading-spinner loading-xs" />}
            Save domains
          </button>
        </div>
      </div>
    </section>
  );
}
