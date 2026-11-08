"use client";

import ValidatedForm from "@/components/ui/ValidatedForm";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

type Step = "email" | "verify" | "choose" | "sent";
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [codeMethod, setCodeMethod] = useState<"primary" | "recovery">("primary");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [options, setOptions] = useState<{ primary: string; recovery: string | null }>({ primary: "", recovery: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function request(action: "lookup" | "verify" | "send", method?: "primary" | "recovery") {
    setError(""); setLoading(true);
    try {
      const res = await fetch(action === "lookup" ? "/api/auth/forgot-password" : "/api/auth/recovery", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "lookup" ? { email, method: method ?? codeMethod } : action === "verify" ? { action, code } : { action, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setCooldown(Number(res.headers.get("Retry-After")) || 60);
        throw new Error(data.error || "Please try again.");
      }
      if (action === "lookup") { setCodeMethod(method ?? codeMethod); setStep("verify"); setCode(""); setCooldown(60); }
      if (action === "verify") { setOptions(data); setStep("choose"); }
      if (action === "send") { setStep("sent"); setCooldown(60); }
      setMessage(data.message || "");
    } catch (err) { setError(err instanceof Error ? err.message : "A network error occurred. Please try again."); }
    finally { setLoading(false); }
  }
  function back() { setCodeMethod("primary"); setStep("email"); setCode(""); setOptions({ primary: "", recovery: null }); setError(""); setMessage(""); }

  return (
    <div className="card kt-card w-full max-w-md">
      <div className="card-body gap-6">
        <div className="flex flex-col items-center gap-2 mb-2 text-center">
          <BrandMark />
          <h1 className="font-sans text-xl font-semibold text-base-content">{step === "choose" ? "Choose recovery method" : step === "sent" ? "Email sent" : "Forgot password"}</h1>
          <p className="text-xs text-base-content/60">{step === "email" ? "Enter your primary registered email address." : step === "verify" ? "Verify ownership before choosing where to receive your reset link." : "Reset links expire in 15 minutes."}</p>
        </div>
        <div aria-live="polite">
          <FeedbackBanner variant="success" message={message || null} />
          <FeedbackBanner variant="error" message={error || null} />
        </div>
        {(step === "email" || step === "verify") && (
          <ValidatedForm onSubmit={e => { e.preventDefault(); void request(step === "email" ? "lookup" : "verify"); }} className="flex flex-col gap-4">
            <label className="form-control flex flex-col w-full gap-2 text-xs font-semibold">
              {step === "email" ? "Primary Email Address" : "Verification code"}
              {step === "email" ? <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered input-sm w-full" required disabled={loading} /> :
                <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" minLength={8} maxLength={8} className="input input-bordered input-sm w-full" required disabled={loading} />}
            </label>
            <button disabled={loading} className="btn btn-primary btn-sm w-full">{loading ? "Please wait…" : step === "email" ? "Continue" : "Verify code"}</button>
          </ValidatedForm>
        )}
        {step === "choose" && <div className="space-y-3">
          <button disabled={loading} onClick={() => void request("send", "primary")} className="btn btn-primary btn-sm w-full h-auto py-3">Send to Primary Email — {options.primary}</button>
          {options.recovery && <button disabled={loading} onClick={() => void request("send", "recovery")} className="btn btn-outline btn-primary btn-sm w-full h-auto py-3">Send to Recovery Email — {options.recovery}</button>}
        </div>}
        {step === "verify" && (
          <div className="space-y-2 text-center">
            <button type="button" disabled={loading || (codeMethod === "recovery" && cooldown > 0)} onClick={() => void request("lookup", "recovery")} className="btn btn-outline btn-primary btn-sm w-full">
              Send code to backup email
            </button>
            <p className="text-xs text-base-content/60">Your backup email must be saved and verified in your profile.</p>
          </div>
        )}
        {(step === "verify" || step === "sent") && <button disabled={loading || cooldown > 0} onClick={() => void request("lookup")} className="btn btn-ghost btn-sm">{cooldown > 0 ? `Resend available in ${cooldown}s` : step === "sent" ? "Resend link (verify again)" : "Resend code"}</button>}
        {step !== "email" && <button disabled={loading} onClick={back} className="btn btn-ghost btn-sm">Back</button>}
        <div className="text-center text-xs text-base-content/50 border-t border-base-200 pt-4">
          <Link className="text-primary font-bold hover:underline" href="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
