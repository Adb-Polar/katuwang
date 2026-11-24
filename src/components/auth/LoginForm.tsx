"use client";

import RequiredMark from "@/components/ui/RequiredMark";
import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { loginNoticeFromQuery, noticeForSignInError } from "@/lib/loginNotice";

/** Google's "G" — the one brand mark the sign-in button is required to carry. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

export default function LoginForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
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
  const [blocked, setBlocked] = useState(false);

  // A failed Google sign-in or the route guard lands here with ?error= / ?reason=.
  const queryNotice = loginNoticeFromQuery(params);
  const queryRedirect = queryNotice.redirectTo;
  useEffect(() => {
    if (queryRedirect) router.replace(queryRedirect);
  }, [queryRedirect, router]);
  const shownError = error || queryNotice.message || "";
  const suggestContact = error ? blocked : queryNotice.suggestContact === true;

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
        const notice = noticeForSignInError(result.error, email);
        if (notice.redirectTo) {
          router.push(notice.redirectTo);
          return;
        }
        // Credential errors ("Invalid email or password.") are our own server
        // text and safe to show as-is; blocked-account errors get fixed copy.
        setError(notice.suggestContact ? notice.message! : result.error);
        setBlocked(notice.suggestContact === true);
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
    <div className="card kt-card w-full max-w-md">
      <div className="card-body gap-6">
        {/* Card Header */}
        <div className="flex flex-col items-center gap-2 mb-2 text-center">
          <BrandMark />
          <h1 className="font-sans text-xl font-semibold text-base-content">Welcome Back</h1>
          <p className="text-xs text-base-content/60">Sign in to your account</p>
        </div>

        <FeedbackBanner variant="success" message={successMsg || null} />
        <FeedbackBanner variant="error" message={shownError || null} />
        {suggestContact && (
          <Link href="/contact" className="btn btn-outline btn-sm text-xs w-full">
            Contact an administrator
          </Link>
        )}

        {success ? (
          /* Successful Login State Animation */
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <h3 className="font-sans text-base font-semibold">Verification Successful</h3>
            <p className="text-xs text-base-content/60">Preparing your portal dashboard. Redirecting...</p>
            <span className="loading loading-ring loading-md text-success"></span>
          </div>
        ) : (
          /* Primary Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">Email Address<RequiredMark /></span>
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
                  <span className="label-text font-semibold text-xs text-base-content/75">Password<RequiredMark /></span>
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

            {googleEnabled && (
              <>
                <div className="divider text-2xs text-base-content/50 my-0">or</div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="btn btn-outline btn-sm w-full text-xs gap-2"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
                <p className="text-2xs text-center text-base-content/50">
                  Works only with the email address your Katuwang account was registered with.
                </p>
              </>
            )}
          </form>
        )}

        {/* Registration Redirection Links */}
        <div className="text-center text-xs text-base-content/50 border-t border-base-200 pt-4">
          <span>New to Katuwang? </span>
          <Link className="text-primary font-bold hover:underline" href={"/register"}>
            Register
          </Link>
          <p className="mt-2">
            Trouble signing in?{" "}
            <Link className="text-primary font-bold hover:underline" href="/contact">
              Contact an administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
