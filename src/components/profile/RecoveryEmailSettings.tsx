"use client";
import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

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
      if (action === "save") { setEmail(data.recoveryEmail ?? ""); setSavedEmail(data.recoveryEmail ?? ""); setVerified(Boolean(data.recoveryEmailVerifiedAt)); setPassword(""); setCode(""); setMessage(data.recoveryEmail ? data.recoveryEmailVerifiedAt ? "Recovery email saved." : "Recovery email saved. Verify ownership before using it for password recovery." : "Recovery email removed."); }
      else { setMessage(data.message); if (action === "verify") { setVerified(true); setCode(""); } }
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  };
  return <section className="card kt-card"><div className="card-body gap-3">
    <h2 className="card-title text-sm">Recovery email</h2>
    <p className="text-xs text-base-content/60">A verified backup address can receive password reset links. Changing it requires your current password and a new ownership check.</p>
    <FeedbackBanner variant="error" message={error || null} /><FeedbackBanner variant="success" message={message || null} />
    {loaded && <>
      <label className="text-xs">Recovery email address<input aria-label="Recovery email address" type="email" className="input input-bordered w-full" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="text-xs">Current password for recovery email<input aria-label="Current password for recovery email" type="password" className="input input-bordered w-full" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label>
      <button type="button" className="btn btn-sm btn-primary self-start" disabled={busy} onClick={() => act("save")}>Save recovery email</button>
      <p className="text-xs">{savedEmail ? verified ? "Saved recovery email verified" : "Saved recovery email not verified" : "No recovery email saved"}</p>
      {savedEmail && !verified && <>
        <button type="button" className="btn btn-sm btn-outline self-start" disabled={busy || email !== savedEmail} onClick={() => act("send")}>Send recovery verification code</button>
        <label className="text-xs">Recovery verification code<input aria-label="Recovery verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input input-bordered w-full" value={code} onChange={e => setCode(e.target.value)} /></label>
        <button type="button" className="btn btn-sm btn-primary self-start" disabled={busy || !/^\d{6}$/.test(code) || email !== savedEmail} onClick={() => act("verify")}>Verify recovery email</button>
      </>}
    </>}
  </div></section>;
}
