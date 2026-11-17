"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";

export default function AccountControls() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const deleteAccount = async (event: React.SubmitEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not delete your account.");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="delete-account" className="space-y-3 border-t border-(--kt-border) pt-6">
      <h2 id="delete-account" className="font-serif text-2xl font-medium leading-tight">Delete your account</h2>
      <p className="text-sm text-(--kt-muted)">
        This permanently removes your profile and its class and request history. It can&apos;t be undone.
      </p>
      <button type="button" className="btn btn-outline btn-error" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? "Keep my account" : "Delete account…"}
      </button>
      {open && (
        <form onSubmit={deleteAccount} className="max-w-sm space-y-4 pt-2">
          <p className="text-sm">Confirm with your password, then type <strong>DELETE</strong>.</p>
          <FeedbackBanner variant="error" message={error || null} />
          <FormField size="md" label="Password">
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="input input-bordered w-full" required />
          </FormField>
          <FormField size="md" label="Type DELETE">
            <input type="text" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="input input-bordered w-full" required />
          </FormField>
          <button type="submit" className="btn btn-error" disabled={busy || confirm !== "DELETE" || !password}>{busy ? "Deleting…" : "Permanently delete my account"}</button>
        </form>
      )}
    </section>
  );
}
