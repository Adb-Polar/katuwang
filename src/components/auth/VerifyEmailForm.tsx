"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle, MailCheck } from "lucide-react";
import AuthHeading from "./AuthHeading";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ResendVerificationButton from "@/components/auth/ResendVerificationButton";

export default function VerifyEmailForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not verify your email.");
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify your email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <span className="lp-status-icon bg-primary/10 text-primary">
        {verified ? <CheckCircle className="h-5 w-5" aria-hidden="true" /> : <MailCheck className="h-5 w-5" aria-hidden="true" />}
      </span>
      <AuthHeading kicker="I-verify" title="Verify your email">
        {verified
          ? "Your email address has been verified. You can now sign in."
          : "Enter the six-digit code we sent to your email. It expires in 10 minutes."}
      </AuthHeading>

      {!verified && (
        <>
          <form onSubmit={handleSubmit} className="lp-form">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="verification-email" className="text-sm font-medium">Email address</label>
              <input
                id="verification-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                required
                className="input input-bordered w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="verification-code" className="text-sm font-medium">Verification code</label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(event) => { setCode(event.target.value.replace(/\D/g, "")); setError(""); }}
                required
                placeholder="000000"
                className="input input-bordered w-full text-center tracking-[0.3em] tabular-nums"
              />
            </div>
            <FeedbackBanner variant="error" message={error || null} />
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? <span className="loading loading-spinner loading-xs" /> : "Verify email"}
            </button>
          </form>
          <p className="mt-6 text-sm text-(--lp-muted)">Didn&apos;t get the code? Check your spam folder or request another one.</p>
          <div className="mt-3">
            <ResendVerificationButton email={email} />
          </div>
        </>
      )}

      <p className="lp-form-foot">
        <Link href="/login" className="lp-link">
          {verified ? "Log in" : "Back to log in"}
        </Link>
      </p>
    </div>
  );
}
