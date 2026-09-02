"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export default function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
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
          <h1 className="font-serif text-xl font-semibold text-base-content">Choose a new password</h1>
          <p className="text-xs text-base-content/60">Enter and confirm your new password below.</p>
        </div>

        <FeedbackBanner variant="error" message={error || null} />

        {done ? (
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <h3 className="font-serif text-base font-semibold">Password updated</h3>
            <p className="text-xs text-base-content/60">Redirecting you to sign in...</p>
          </div>
        ) : !token ? (
          <FeedbackBanner
            variant="error"
            message="This reset link is missing its token. Request a new link from the sign-in page."
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">New Password</span>
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
                  className="input input-bordered input-sm w-full pr-10 focus:input-primary text-xs"
                  disabled={loading}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-base-content transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">Confirm Password</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
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
                  <span>Updating...</span>
                </>
              ) : (
                <span>Reset password</span>
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
