"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/ui/BrandMark";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import { GRADE_LEVELS } from "@/lib/gradeLevels";

type RegisterType = "LEARNER" | "TUTOR";

const ROLE_COPY: Record<RegisterType, { heading: React.ReactNode; subheading: string; buttonLabel: string; border: string }> = {
  LEARNER: {
    heading: (
      <>
        Sign Up to find <span className="text-primary">Katuwang</span>
      </>
    ),
    subheading: "Create your Student Learner account",
    buttonLabel: "Create Learner Account",
    border: "border-secondary/20",
  },
  TUTOR: {
    heading: (
      <>
        Sign Up to be a <span className="text-primary">Katuwang</span>
      </>
    ),
    subheading: "Apply as a Peer Tutor mentor on Katuwang",
    buttonLabel: "Create Tutor Account",
    border: "border-accent/30",
  },
};

export default function RegisterForm({ type }: { type: RegisterType }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = ROLE_COPY[type];

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
        body: JSON.stringify({ type, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      const roleParam = type === "TUTOR" ? "&role=tutor" : "";
      const pendingParam = data.pendingApproval ? "&pending=true" : "";
      router.push(
        `/login?registered=true&id=${encodeURIComponent(data.anonymousId)}${roleParam}${pendingParam}`
      );
    } catch {
      setError("A network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card kt-card w-full`}>
      <div className="card-body gap-5 p-6 md:p-8">
        {/* Card Header */}
        <div className="flex flex-col items-center gap-2 mb-2 text-center">
          <BrandMark />
          <h1 className="font-serif text-xl font-semibold [word-spacing:-0.2em]">{copy.heading}</h1>
          <p className="text-xs text-base-content/60">{copy.subheading}</p>
        </div>

        <FeedbackBanner variant="error" message={error || null} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="First name"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </FormField>

            <FormField label="Last Name" required>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                placeholder="Last name"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </FormField>
          </div>

          <FormField label="Email Address" required>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="input input-bordered input-sm w-full focus:input-primary text-xs"
            />
          </FormField>

          {/* Grade Level & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Grade Level" required>
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
            </FormField>

            <FormField label="Section" required>
              <input
                type="text"
                name="section"
                value={form.section}
                onChange={handleChange}
                required
                placeholder="e.g., Rizal"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </FormField>
          </div>

          <FormField label="Contact Info" hint="Optional — phone or guardian contact">
            <input
              type="text"
              name="contactInfo"
              value={form.contactInfo}
              onChange={handleChange}
              placeholder="Phone or guardian contact"
              className="input input-bordered input-sm w-full focus:input-primary text-xs"
            />
          </FormField>

          <FormField label="Password" required>
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
          </FormField>

          <FormField label="Confirm Password" required>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              className="input input-bordered input-sm w-full focus:input-primary text-xs"
            />
          </FormField>

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
              <span>{copy.buttonLabel}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
