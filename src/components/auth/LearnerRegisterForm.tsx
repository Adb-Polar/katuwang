"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, AlertCircle } from "lucide-react";
import KatuwangIcon from "../symbols/icon";

const GRADE_LEVELS = [
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

export default function LearnerRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gradeLevel: "",
    section: "",
    contactInfo: "",
    consentGiven: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LEARNER", ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      // Redirect to login with success message
      router.push(`/login?registered=true&id=${encodeURIComponent(data.anonymousId)}`);
    } catch {
      setError("A network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 w-full">
      <div className="card-body gap-5 p-6 md:p-8">
        {/* Card Header */}
        <div className="flex flex-col items-center gap-1 mb-2 text-center">
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <KatuwangIcon />
          </div>
          <h1 className="text-xl font-bold [word-spacing:-0.2em]">
            Sign Up to find <span className="text-primary">Katuwang</span>
          </h1>
          <p className="text-xs text-base-content/60">Create your Student Learner account</p>
        </div>
        {error && (
          <div className="alert alert-error text-xs py-3">
            <AlertCircle className="stroke-current shrink-0 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">
                  First Name <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="First name"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">
                  Last Name <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                placeholder="Last name"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs text-base-content/75">
                Email Address <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="input input-bordered input-sm w-full focus:input-primary text-xs"
            />
          </div>

          {/* Grade Level & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">
                  Grade Level <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="gradeLevel"
                value={form.gradeLevel}
                onChange={handleChange}
                required
                className="select select-bordered select-sm w-full focus:select-primary text-xs"
              >
                <option value="">Select grade</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/75">
                  Section <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="section"
                value={form.section}
                onChange={handleChange}
                required
                placeholder="e.g., Rizal"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs text-base-content/75">
                Contact Info <span className="label-text-alt text-base-content/40">(optional)</span>
              </span>
            </label>
            <input
              type="text"
              name="contactInfo"
              value={form.contactInfo}
              onChange={handleChange}
              placeholder="Phone or guardian contact"
              className="input input-bordered input-sm w-full focus:input-primary text-xs"
            />
          </div>

          {/* Password */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs text-base-content/75">
                Password <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="input input-bordered input-sm w-full focus:input-primary text-xs"
            />
          </div>

          {/* Confirm Password */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs text-base-content/75">
                Confirm Password <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              className="input input-bordered input-sm w-full focus:input-primary text-xs"
            />
          </div>

          {/* Consent Checkbox */}
          <div className="alert alert-info bg-info/10 border-info/20 text-base-content text-xs p-4 flex gap-3 items-start">
            <input
              type="checkbox"
              name="consentGiven"
              id="consent"
              checked={form.consentGiven}
              onChange={handleChange}
              required
              className="checkbox checkbox-primary checkbox-xs mt-0.5"
            />
            <label htmlFor="consent" className="cursor-pointer select-none leading-relaxed">
              I confirm that a parent or guardian has consented to this registration. Personal information collected is
              used solely for academic support purposes in accordance with RA 10173 (Data Privacy Act of 2012).{" "}
              <span className="text-error">*</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-sm w-full mt-2 cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Learner Account</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
