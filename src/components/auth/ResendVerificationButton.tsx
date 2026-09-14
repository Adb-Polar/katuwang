"use client";

import { useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export default function ResendVerificationButton({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend the verification email.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the verification email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <FeedbackBanner
        variant="success"
        message={sent ? "If that account needs verification, a new link is on its way." : null}
      />
      <FeedbackBanner variant="error" message={error || null} />
      <button
        type="button"
        onClick={handleResend}
        disabled={sending || !email}
        className="btn btn-primary btn-sm w-full cursor-pointer text-xs"
      >
        {sending ? <span className="loading loading-spinner loading-xs"></span> : "Resend verification email"}
      </button>
    </div>
  );
}
