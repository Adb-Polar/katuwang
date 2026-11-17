"use client";
import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";

export default function RecoveryEmailSettings() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/user/recovery-email").then(async response => {
      if (!response.ok) throw Error("Could not load your recovery email.");
      const data = await response.json();
      if (active) { setEmail(data.recoveryEmail ?? ""); setSavedEmail(data.recoveryEmail ?? ""); setVerified(Boolean(data.recoveryEmailVerifiedAt)); setLoaded(true); }
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  const act = async (action: "save" | "send" | "verify") => {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/user/recovery-email${action === "verify" ? "/verify" : ""}`, {
        method: action === "save" ? "PATCH" : "POST", headers: { "content-type": "application/json" },
        ...(action === "send" ? {} : { body: JSON.stringify(action === "save" ? { recoveryEmail: email, currentPassword: password } : { code }) }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Please try again.");
      if (action === "save") { setEmail(data.recoveryEmail ?? ""); setSavedEmail(data.recoveryEmail ?? ""); setVerified(Boolean(data.recoveryEmailVerifiedAt)); setPassword(""); setCode(""); setEditing(false); setMessage(data.recoveryEmail ? data.recoveryEmailVerifiedAt ? "Recovery email saved." : "Recovery email saved. Verify ownership before using it for password recovery." : "Recovery email removed."); }
      else { setMessage(data.message); if (action === "verify") { setVerified(true); setCode(""); } }
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  };
  const cancel = () => { setEmail(savedEmail); setPassword(""); setCode(""); setError(""); setMessage(""); setEditing(false); };
  return (
    <section className="card kt-card" aria-labelledby="recovery-email">
      <div className="kt-card-body gap-4">
        <div>
          <h2 id="recovery-email" className="font-serif text-2xl font-medium leading-tight">Recovery email</h2>
          <p className="text-sm text-(--kt-muted)">A backup address for password reset codes, different from your sign-in email.</p>
        </div>
        <FeedbackBanner variant="error" message={error || null} />
        <FeedbackBanner variant="success" message={message || null} />
        {!loaded && !error && <p role="status" className="text-sm text-(--kt-muted)">Loading…</p>}

        {loaded && !editing && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 break-all">
              {savedEmail ? <span className="font-medium">{savedEmail}</span> : <span className="text-(--kt-muted)">Not set</span>}
              {savedEmail && (
                <span className={`text-sm ${verified ? "text-success" : "text-warning-content"}`}>
                  {" · "}{verified ? "Verified" : "Not verified yet"}
                </span>
              )}
            </p>
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => { setError(""); setMessage(""); setEditing(true); }}>
              {savedEmail ? "Change" : "Add a recovery email"}
            </button>
          </div>
        )}

        {loaded && editing && (
          <div className="space-y-4 max-w-md">
            <FormField size="md" label="Recovery email" hint="Leave it blank to remove your recovery email.">
              <input type="email" placeholder="backup@example.com" className="input input-bordered w-full" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy} />
            </FormField>
            <FormField size="md" label="Your Katuwang password" hint="To confirm it's you.">
              <input type="password" className="input input-bordered w-full" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" disabled={busy} />
            </FormField>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act("save")}>{busy ? "Saving…" : "Save"}</button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={cancel}>Cancel</button>
            </div>
          </div>
        )}

        {loaded && !editing && savedEmail && !verified && (
          <div className="space-y-4 max-w-md border-t border-(--kt-border) pt-4">
            <p className="text-sm">Verify this address before it can be used to reset your password.</p>
            <button type="button" className="btn btn-outline" disabled={busy || email !== savedEmail} onClick={() => act("send")}>Send a code</button>
            <FormField size="md" label="6-digit code" hint="Check the recovery inbox for the code we sent.">
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input input-bordered w-full" value={code} onChange={e => setCode(e.target.value)} disabled={busy} />
            </FormField>
            <button type="button" className="btn btn-primary" disabled={busy || !/^\d{6}$/.test(code) || email !== savedEmail} onClick={() => act("verify")}>Verify</button>
          </div>
        )}
      </div>
    </section>
  );
}
