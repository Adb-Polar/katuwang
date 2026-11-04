"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle, ArrowLeft, MailCheck } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
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
    <div className="card kt-card w-full max-w-md">
      <div className="card-body gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandMark />
          <h1 className="font-sans text-xl font-semibold text-base-content">Verify your email</h1>
          <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-info/15 text-info">
            {verified ? <CheckCircle className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />}
          </div>
          <p className="text-xs leading-relaxed text-base-content/70">
            {verified
              ? "Your email address has been verified. You can now sign in."
              : "Enter the six-digit code we sent to your email. It expires in 10 minutes."}
          </p>
        </div>

        {!verified && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="verification-email" className="mb-1 block text-xs font-semibold">Email address</label>
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
              <div>
                <label htmlFor="verification-code" className="mb-1 block text-xs font-semibold">Verification code</label>
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
                  className="input input-bordered w-full text-center font-mono tracking-[0.3em]"
                />
              </div>
              <FeedbackBanner variant="error" message={error || null} />
              <button type="submit" disabled={submitting} className="btn btn-primary w-full cursor-pointer text-xs">
                {submitting ? <span className="loading loading-spinner loading-xs" /> : "Verify email"}
              </button>
            </form>
            <p className="text-center text-xs text-base-content/60">Didn&apos;t get the code? Check your spam folder or request another one.</p>
            <ResendVerificationButton email={email} />
          </>
        )}

        <div className="border-t border-base-200 pt-4 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
