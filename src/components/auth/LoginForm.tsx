"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Derive success message from registration redirect query parameters
  const isRegistered = params.get("registered") === "true";
  const isPending = params.get("pending") === "true";
  const id = params.get("id");
  const role = params.get("role");
  const successMsg = isPending
    ? `Registration received! Your ${role === "tutor" ? "tutor" : "learner"} ID is ${id}. An administrator needs to approve your account before you can sign in — you'll be able to log in once that's done.`
    : isRegistered
    ? role === "tutor"
      ? `Account created! Your tutor ID is ${id}. Please log in — you can schedule your first class right away, then request a topic assessment once you're teaching it.`
      : `Account created! Your learner ID is ${id}. Please log in to start requesting tutoring sessions.`
    : "";

  // Handle Form Submission using NextAuth
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        // Delay redirect slightly for the success animation
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      }
    } catch {
      setError("A network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 w-full max-w-md shadow-sm border border-base-200">
      <div className="card-body gap-6">
        {/* Card Header */}
        <div className="flex flex-col items-center gap-2 mb-2 text-center">
          <BrandMark />
          <h1 className="font-serif text-xl font-semibold text-base-content">Welcome Back</h1>
          <p className="text-xs text-base-content/60">Sign in to your account</p>
        </div>

        <FeedbackBanner variant="success" message={successMsg || null} />
        <FeedbackBanner variant="error" message={error || null} />

        {success ? (
          /* Successful Login State Animation */
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <h3 className="font-serif text-base font-semibold">Verification Successful</h3>
            <p className="text-xs text-base-content/60">Preparing your portal dashboard. Redirecting...</p>
            <span className="loading loading-ring loading-md text-success"></span>
          </div>
        ) : (
          /* Primary Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
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

            {/* Password Input */}
            <div className="form-control w-full">
              <div className="flex items-center justify-between">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs text-base-content/75">Password</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className="input input-bordered input-sm w-full pr-10 focus:input-primary text-xs"
                  disabled={loading}
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
            <div className="flex justify-end text-2xs">
              <Link
                href="/forgot-password"
                className="text-base-content/50 hover:text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-control">
              <label className="label justify-start gap-2 cursor-pointer py-1">
                <input type="checkbox" className="checkbox checkbox-primary checkbox-xs" disabled={loading} />
                <span className="label-text text-xs text-base-content/60 select-none">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm w-full mt-2 cursor-pointer text-xs"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>
        )}

        {/* Registration Redirection Links */}
        <div className="text-center text-xs text-base-content/50 border-t border-base-200 pt-4">
          <span>New to Katuwang? </span>
          <Link className="text-primary font-bold hover:underline" href={"/register"}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
