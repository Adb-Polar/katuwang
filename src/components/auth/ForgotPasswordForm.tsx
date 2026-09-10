"use client";

import React, { useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSent(data.message || "If an account matches that address, we've sent a reset link.");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card kt-card w-full max-w-md">
      <div className="card-body gap-6">
        <div className="flex flex-col items-center gap-2 mb-2 text-center">
          <BrandMark />
          <h1 className="font-sans text-xl font-semibold text-base-content">Reset your password</h1>
          <p className="text-xs text-base-content/60">
            Enter your account email or your recovery email and we&apos;ll send a reset link.
          </p>
        </div>

        <FeedbackBanner variant="success" message={sent || null} />
        <FeedbackBanner variant="error" message={error || null} />

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">Email Address</span>
              </label>
              <input
                type="email"
                placeholder="example@katuwang.ph"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm w-full mt-2 cursor-pointer text-xs"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send reset link</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-base-content/50 border-t border-base-200 pt-4">
          <Link className="text-primary font-bold hover:underline" href="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
