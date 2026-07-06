"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const [successMsg, setSuccessMsg] = useState("");

  // Show success message from registration redirect
  useEffect(() => {
    if (params.get("registered") === "true") {
      const id = params.get("id");
      const role = params.get("role");
      if (role === "tutor") {
        setSuccessMsg(
          `Account created! Your tutor ID is ${id}. Please log in — you'll be prompted to take your qualifying assessment(s) before being matched with learners.`
        );
      } else {
        setSuccessMsg(
          `Account created! Your learner ID is ${id}. Please log in to start requesting tutoring sessions.`
        );
      }
    }
  }, [params]);

  // Handle Form Submission using NextAuth
  const handleSubmit = async (e: React.FormEvent) => {
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
        <div className="flex flex-col items-center gap-1 mb-2 text-center">
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <div className="p-1 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M13 14h3" />
              </svg>
            </div>
            <h2 className="text-xs font-black tracking-wider uppercase text-base-content">Katuwang</h2>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Welcome Back</h1>
          <p className="text-xs text-base-content/60">Sign in to your account</p>
        </div>

        {/* Success Msg (Redirect from register) */}
        {successMsg && (
          <div className="alert alert-success py-3 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Alert Notification */}
        {error && (
          <div className="alert alert-error py-3 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success ? (
          /* Successful Login State Animation */
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-base font-bold">Verification Successful</h3>
            <p className="text-xs text-base-content/60">
              Preparing your portal dashboard. Redirecting...
            </p>
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
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Password reset instructions sent.");
                  }}
                  className="link link-hover text-[10px] text-primary"
                >
                  Forgot Password?
                </a>
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
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-control">
              <label className="label justify-start gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-xs"
                  disabled={loading}
                />
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

            {/* Social Login Separator */}
            <div className="divider text-[10px] text-base-content/40 my-4 uppercase tracking-wider">
              Or choose social authorization
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => alert("Google Sign-In requested.")}
                className="btn btn-outline btn-sm font-semibold flex items-center justify-center gap-2 text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => alert("GitHub Sign-In requested.")}
                className="btn btn-outline btn-sm font-semibold flex items-center justify-center gap-2 text-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </form>
        )}

        {/* Registration Redirection Links */}
        <div className="text-center text-xs text-base-content/50 border-t border-base-200 pt-4">
          <span>New to Katuwang? </span>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Link href="/register/learner" className="link link-primary font-semibold">
              Sign up as Student
            </Link>
            <span className="text-base-content/30">|</span>
            <Link href="/register/tutor" className="link link-secondary font-semibold">
              Sign up as Mentor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
