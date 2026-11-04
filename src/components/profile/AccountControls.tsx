"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

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
    <section className="card kt-card border border-error/25">
      <div className="card-body gap-3 p-6">
        <h2 className="card-title text-sm font-bold">Account controls</h2>
        <p className="text-xs text-base-content/60">You can update your details above. Deleting your account permanently removes your profile and associated records. This cannot be undone.</p>
        <button type="button" className="btn btn-outline btn-error btn-sm w-fit text-xs" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? "Cancel deletion" : "Delete account"}
        </button>
        {open && (
          <form onSubmit={deleteAccount} className="mt-2 max-w-sm space-y-3 rounded-lg border border-error/25 bg-error/5 p-4">
            <p className="text-xs">Confirm with your password, then type <strong>DELETE</strong>. Your account and its class or request history will be removed.</p>
            <FeedbackBanner variant="error" message={error || null} />
            <label className="block text-xs font-semibold">Password
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="input input-bordered mt-1 w-full" required />
            </label>
            <label className="block text-xs font-semibold">Type DELETE
              <input type="text" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="input input-bordered mt-1 w-full" required />
            </label>
            <button type="submit" className="btn btn-error btn-sm" disabled={busy || confirm !== "DELETE" || !password}>{busy ? "Deleting…" : "Permanently delete account"}</button>
          </form>
        )}
      </div>
    </section>
  );
}
