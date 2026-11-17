"use client";

import { reportFieldError } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import AuthHeading from "./AuthHeading";
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
  const successMsg = params.get("reset") === "true"
    ? "Your password has been reset. You can now sign in."
    : params.get("passwordChanged") === "true"
    ? "Password updated. Please sign in again with your new password."
    : isPending
    ? `Registration received! Your ${role === "tutor" ? "tutor" : "learner"} ID is ${id}. An administrator needs to approve your account before you can sign in — you'll be able to log in once that's done.`
    : isRegistered
    ? role === "tutor"
      ? `Account created! Your tutor ID is ${id}. Please log in — you can schedule your first class right away, then request a topic assessment once you're teaching it.`
      : `Account created! Your learner ID is ${id}. Please log in to start requesting tutoring sessions.`
    : "";

  // Handle Form Submission using NextAuth
  const handleSubmit = async (e: React.SubmitEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();

    if (!email || !password) {
      reportFieldError(validationForm, !email ? "Email Address" : "Password", "Please fill in this field.");
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
        if (result.error === "ACCOUNT_PENDING") {
          router.push("/pending-approval");
          return;
        }
        if (result.error.startsWith("ACCOUNT_DECLINED")) {
          const sep = result.error.indexOf(":");
          const reason = sep >= 0 ? result.error.slice(sep + 1).trim() : "";
          router.push(reason ? `/account-declined?reason=${encodeURIComponent(reason)}` : "/account-declined");
          return;
        }
        if (result.error === "ACCOUNT_UNVERIFIED") {
          router.push(`/account-unverified?email=${encodeURIComponent(email)}`);
          return;
        }
        if (result.error === "EMAIL_NOT_FOUND") {
          reportFieldError(validationForm, "Email Address", "Email does not exist");
        } else if (result.error === "INCORRECT_PASSWORD") {
          reportFieldError(validationForm, "Password", "Incorrect password.");
        } else if (result.error === "CredentialsSignin") {
          setError("Could not sign in. Please try again.");
        } else {
          setError(result.error);
        }
        setLoading(false);
      } else {
        setSuccess(true);
        // Short pause so the signed-in message is readable before the portal loads
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
    <div>
      <AuthHeading kicker="Mag-log in" title="Log in to Katuwang">
        Use the email you registered with.
      </AuthHeading>

      <div className="space-y-3 mb-6 empty:hidden">
        <FeedbackBanner variant="success" message={successMsg || null} />
        <FeedbackBanner variant="error" message={error || null} />
      </div>

      {success ? (
        <div className="flex items-center gap-3" role="status">
          <span className="lp-status-icon bg-success/15 text-success mb-0">
            <Check className="w-5 h-5" aria-hidden="true" />
          </span>
          <p>You’re signed in. Opening your portal…</p>
        </div>
      ) : (
        <ValidatedForm onSubmit={handleSubmit} className="lp-form">
          <div data-form-field="Email Address" className="form-control w-full">
            <label htmlFor="login-email" className="label py-1">
              <span className="label-text">Email address</span>
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="example@katuwang.ph"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className="input input-bordered w-full"
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div data-form-field="Password" className="form-control w-full">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="label py-1">
                <span className="label-text">Password</span>
              </label>
              <Link href="/forgot-password" className="lp-link text-sm">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="input input-bordered w-full pr-10"
                autoComplete="current-password"
                disabled={loading}
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

          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Logging in…</span>
              </>
            ) : (
              <span>Log in</span>
            )}
          </button>
        </ValidatedForm>
      )}

      <p className="lp-form-foot">
        New to Katuwang?{" "}
        <Link className="lp-link" href="/register">
          Create an account
        </Link>
      </p>
    </div>
  );
}
