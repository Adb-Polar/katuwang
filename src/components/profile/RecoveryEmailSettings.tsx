"use client";
import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import StatusBadge from "@/components/ui/StatusBadge";

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
  return <section className="card kt-card"><div className="card-body gap-3">
    <h2 className="card-title text-sm">Recovery email</h2>
    <p className="text-xs text-base-content/60">Add a backup email to receive verification codes if you forget your password. Verify the address before using it for password recovery.</p>
    <FeedbackBanner variant="error" message={error || null} /><FeedbackBanner variant="success" message={message || null} />
    {loaded && <>
      <FormField label="Recovery email address" hint={editing ? "Use a different address from your Katuwang sign-in email. Leave blank to remove it." : "Choose Edit recovery email to change this address."} orientation="horizontal">
        <input type="email" placeholder="backup@example.com" className="input input-bordered input-md text-sm w-full focus:input-primary" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" readOnly={!editing} disabled={busy} />
      </FormField>
      {editing ? <>
        <FormField label="Current Katuwang password" hint="Enter the password you use to sign in to Katuwang to confirm this change." orientation="horizontal">
          <input type="password" placeholder="Enter your sign-in password" className="input input-bordered input-md text-sm w-full focus:input-primary" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" disabled={busy} />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => act("save")}>{busy ? "Saving…" : "Save recovery email"}</button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => { setEmail(savedEmail); setPassword(""); setCode(""); setError(""); setMessage(""); setEditing(false); }}>Cancel</button>
        </div>
      </> : <button type="button" className="btn btn-sm btn-outline self-start" disabled={busy} onClick={() => { setError(""); setMessage(""); setEditing(true); }}>Edit recovery email</button>}
      <div><StatusBadge tone={savedEmail ? verified ? "success" : "warning" : "neutral"} label={savedEmail ? verified ? "Recovery email verified" : "Verification needed" : "No recovery email saved"} /></div>
      {!editing && savedEmail && !verified && <>
        <button type="button" className="btn btn-sm btn-outline self-start" disabled={busy || email !== savedEmail} onClick={() => act("send")}>Send recovery verification code</button>
        <FormField label="Email verification code" hint="Enter the 6-digit code sent to your recovery email." orientation="horizontal">
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" className="input input-bordered input-md text-sm w-full focus:input-primary" value={code} onChange={e => setCode(e.target.value)} disabled={busy} />
        </FormField>
        <button type="button" className="btn btn-sm btn-primary self-start" disabled={busy || !/^\d{6}$/.test(code) || email !== savedEmail} onClick={() => act("verify")}>Verify recovery email</button>
      </>}
    </>}
  </div></section>;
}
