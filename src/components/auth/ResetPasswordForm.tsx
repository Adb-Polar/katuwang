"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import AuthHeading from "./AuthHeading";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export default function ResetPasswordForm() {
  const router = useRouter();
  const legacyToken = useRef(useSearchParams().get("token") ?? "");
  const [token, setToken] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [validating, setValidating] = useState(true);
  const initialToken = useRef<string | null>(null);
  useEffect(() => {
    // Keep the credential in memory and remove it from history/referrers.
    // The ref also preserves it during React Strict Mode effect replays.
    initialToken.current ??= new URLSearchParams(window.location.hash.slice(1)).get("token") ?? legacyToken.current;
    window.history.replaceState(null, "", window.location.pathname);
    let active = true;
    async function validate() {
      try {
        const res = await fetch("/api/auth/reset-password/validate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialToken.current ? { token: initialToken.current } : {}),
        });
        if (active && res.ok) {
          setToken(initialToken.current ?? "");
          setAuthorized(true);
        }
      } finally { if (active) setValidating(false); }
    }
    void validate().catch(() => {});
    return () => { active = false; };
  }, []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    if (password.length < 8) {
      reportFieldError(e.currentTarget, "New Password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      reportFieldError(e.currentTarget, "Confirm Password", "Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(token ? { token } : {}), password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login?reset=true"), 2000);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthHeading kicker="Bagong password" title="Choose a new password">
        Enter and confirm your new password below.
      </AuthHeading>

      <div className="mb-6 empty:hidden">
        <FeedbackBanner variant="error" message={error || null} />
      </div>

      {done ? (
        <div className="flex items-center gap-3" role="status">
          <span className="lp-status-icon bg-success/15 text-success mb-0">
            <Check className="w-5 h-5" aria-hidden="true" />
          </span>
          <p>Password updated. Taking you to log in…</p>
        </div>
      ) : validating ? (
        <p className="text-(--lp-muted)" role="status">Checking password reset authorization…</p>
      ) : !authorized ? (
        <FeedbackBanner
          variant="error"
          message="This password reset authorization is invalid or has expired. Request a new code from the Forgot Password page."
        />
      ) : (
        <ValidatedForm onSubmit={handleSubmit} className="lp-form">
          <div data-form-field="New Password" className="form-control w-full">
            <label className="label py-1">
              <span className="label-text">New Password<span className="text-error ml-0.5" aria-hidden="true">*</span></span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="input input-bordered w-full pr-10"
                disabled={loading}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-(--kt-muted) hover:text-base-content cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div data-form-field="Confirm Password" className="form-control w-full">
            <label className="label py-1">
              <span className="label-text">Confirm Password<span className="text-error ml-0.5" aria-hidden="true">*</span></span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your new password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (error) setError("");
              }}
              className="input input-bordered w-full"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Updating...</span>
              </>
            ) : (
              <span>Reset password</span>
            )}
          </button>
        </ValidatedForm>
      )}

      <p className="lp-form-foot">
        <Link className="lp-link" href="/login">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
