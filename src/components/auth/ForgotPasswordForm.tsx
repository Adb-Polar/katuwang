"use client";

import ValidatedForm from "@/components/ui/ValidatedForm";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthHeading from "./AuthHeading";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

type Step = "email" | "verify";
export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codeMethod, setCodeMethod] = useState<"primary" | "recovery">("primary");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function request(action: "lookup" | "verify", method?: "primary" | "recovery") {
    setError(""); setLoading(true);
    try {
      const res = await fetch(action === "lookup" ? "/api/auth/forgot-password" : "/api/auth/recovery", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "lookup" ? { email, method: method ?? codeMethod } : { action, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setCooldown(Number(res.headers.get("Retry-After")) || 60);
        throw new Error(data.error || "Please try again.");
      }
      if (action === "lookup") { setCodeMethod(method ?? codeMethod); setStep("verify"); setCode(""); setCooldown(60); }
      if (action === "verify") router.push("/reset-password");
      setMessage(data.message || "");
    } catch (err) { setError(err instanceof Error ? err.message : "A network error occurred. Please try again."); }
    finally { setLoading(false); }
  }
  function back() { setCodeMethod("primary"); setStep("email"); setCode(""); setError(""); setMessage(""); }

  return (
    <div>
      <AuthHeading kicker="Nakalimutan?" title="Forgot password">
        {step === "email" ? "Enter your primary registered email address." : "Enter your verification code to set a new password. Codes expire in 15 minutes."}
      </AuthHeading>
      <div aria-live="polite" className="space-y-3 mb-6 empty:mb-0">
        <FeedbackBanner variant="success" message={message || null} />
        <FeedbackBanner variant="error" message={error || null} />
      </div>
      {(step === "email" || step === "verify") && (
        <ValidatedForm onSubmit={e => { e.preventDefault(); void request(step === "email" ? "lookup" : "verify"); }} className="lp-form">
          <label className="form-control flex flex-col w-full gap-2 text-sm font-medium">
            <span>{step === "email" ? "Primary Email Address" : "Verification code"}<span className="text-error ml-0.5" aria-hidden="true">*</span></span>
            {step === "email" ? <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered w-full" required disabled={loading} /> :
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" minLength={8} maxLength={8} className="input input-bordered w-full tracking-[0.2em]" required disabled={loading} />}
          </label>
          <button disabled={loading} className="btn btn-primary w-full">{loading ? "Please wait…" : step === "email" ? "Continue" : "Verify code"}</button>
        </ValidatedForm>
      )}
      {step === "verify" && (
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" disabled={loading || (codeMethod === "recovery" && cooldown > 0)} onClick={() => void request("lookup", "recovery")} className="btn btn-outline btn-primary w-full">
            Send code to backup email
          </button>
          <p className="text-sm text-(--lp-muted)">Your backup email must be saved and verified in your profile.</p>
          <div className="flex gap-4">
            <button disabled={loading || cooldown > 0} onClick={() => void request("lookup")} className="lp-link disabled:text-(--lp-muted) disabled:no-underline">{cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend code"}</button>
            <button disabled={loading} onClick={back} className="lp-link">Use a different email</button>
          </div>
        </div>
      )}
      <p className="lp-form-foot">
        Remembered it? <Link className="lp-link" href="/login">Back to log in</Link>
      </p>
    </div>
  );
}
