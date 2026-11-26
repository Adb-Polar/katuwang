"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import AuthHeading from "./AuthHeading";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import { LRN, LRN_LENGTH, PERSON_NAME, SECTION_NAME } from "@/lib/validations/textRules";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { EMAIL_INPUT_MESSAGE, EMAIL_INPUT_PATTERN } from "@/lib/validations/email";

type RegisterType = "LEARNER" | "TUTOR";

const ROLE_COPY: Record<RegisterType, { heading: React.ReactNode; subheading: string; buttonLabel: string }> = {
  LEARNER: {
    heading: (
      <>
        Sign up as a <span className="text-secondary">learner</span>
      </>
    ),
    subheading: "Open to every student in Grades 7–12.",
    buttonLabel: "Create Learner Account",
  },
  TUTOR: {
    heading: (
      <>
        Sign up as a <span className="text-(--lp-tutor)">tutor</span>
      </>
    ),
    subheading: "Grades 9–12 can apply. You’ll pass a topic test before teaching it.",
    buttonLabel: "Create Tutor Account",
  },
};

export default function RegisterForm({ type }: { type: RegisterType }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const copy = ROLE_COPY[type];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    recoveryEmail: "",
    password: "",
    confirmPassword: "",
    gradeLevel: "",
    section: "",
    studentIdNumber: "",
    adviserTeacherName: "",
    contactInfo: "",
    consentGiven: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      reportFieldError(e.currentTarget, "Confirm Password", "Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      reportFieldError(e.currentTarget, "Password", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form, studentIdNumber: form.studentIdNumber.trim(), adviserTeacherName: form.adviserTeacherName.trim() }),
      });

      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      if (data.requiresVerification) {
        router.push(`/verify-email/check-email?email=${encodeURIComponent(form.email)}`);
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
    <div>
      <AuthHeading kicker="Mag-sign up" title={copy.heading}>
        {copy.subheading}
      </AuthHeading>

      <div className="mb-6 empty:hidden">
        <FeedbackBanner variant="error" message={error || null} />
      </div>

      <ValidatedForm onSubmit={handleSubmit} className="lp-form">
        <h2 className="lp-section-title">About you</h2>
        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField size="md" label="First Name" required>
            <input
              type="text"
              name="firstName"
              maxLength={50}
              autoCapitalize="words"
              pattern={PERSON_NAME.pattern}
              title={PERSON_NAME.message}
              value={form.firstName}
              onChange={handleChange}
              required
              placeholder="First name"
              className="input input-bordered w-full"
            />
          </FormField>

          <FormField size="md" label="Last Name" required>
            <input
              type="text"
              name="lastName"
              maxLength={50}
              autoCapitalize="words"
              pattern={PERSON_NAME.pattern}
              title={PERSON_NAME.message}
              value={form.lastName}
              onChange={handleChange}
              required
              placeholder="Last name"
              className="input input-bordered w-full"
            />
          </FormField>
        </div>

        <FormField size="md" label="LRN (Learner Reference Number)" required>
          <input
            type="text"
            name="studentIdNumber"
            inputMode="numeric"
            pattern={LRN.pattern}
            title={LRN.message}
            value={form.studentIdNumber}
            onChange={handleChange}
            required
            maxLength={LRN_LENGTH}
            placeholder="12-digit LRN"
            className="input input-bordered w-full"
          />
        </FormField>

        <FormField size="md" label="Adviser Teacher's Name" required>
          <input
            type="text"
            name="adviserTeacherName"
            autoCapitalize="words"
            pattern={PERSON_NAME.pattern}
            title={PERSON_NAME.message}
            value={form.adviserTeacherName}
            onChange={handleChange}
            required
            maxLength={191}
            placeholder="Enter your adviser's full name"
            className="input input-bordered w-full"
          />
        </FormField>

        {/* Grade Level & Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField size="md" label="Grade Level" required>
            <select
              name="gradeLevel"
              value={form.gradeLevel}
              onChange={handleChange}
              required
              className="select select-bordered w-full"
            >
              <option value="">Select grade</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField size="md" label="Section" required>
            <input
              type="text"
              name="section"
              pattern={SECTION_NAME.pattern}
              title={SECTION_NAME.message}
              value={form.section}
              onChange={handleChange}
              required
              maxLength={50}
              placeholder="e.g., Rizal"
              className="input input-bordered w-full"
            />
          </FormField>
        </div>

        <h2 className="lp-section-title">Contact</h2>

        <FormField size="md" label="Email Address" required>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            pattern={EMAIL_INPUT_PATTERN}
            title={EMAIL_INPUT_MESSAGE}
            placeholder="you@example.com"
            className="input input-bordered w-full"
          />
        </FormField>

        <FormField size="md" label="Recovery Email (optional)" hint="Verify this backup address from your profile after signing in before using it for password recovery.">
          <input type="email" name="recoveryEmail" value={form.recoveryEmail} onChange={handleChange} placeholder="backup@example.com" className="input input-bordered w-full" />
        </FormField>

        <FormField size="md" label="Contact Info" hint="Optional — Philippine mobile number">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            name="contactInfo"
            value={form.contactInfo}
            onChange={handleChange}
            placeholder="0917 123 4567"
            className="input input-bordered w-full"
          />
        </FormField>

        <h2 className="lp-section-title">Password</h2>

        <FormField size="md" label="Password" required>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="input input-bordered w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-(--kt-muted) hover:text-base-content cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <FormField size="md" label="Confirm Password" required>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              className="input input-bordered w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-(--kt-muted) hover:text-base-content cursor-pointer"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        {/* Consent Checkbox */}
        <div data-form-field="Consent" className="space-y-1">
        <div className="lp-note flex gap-3 items-start text-sm">
          <input
            type="checkbox"
            name="consentGiven"
            id="consent"
            checked={form.consentGiven}
            onChange={handleChange}
            required
            className="checkbox checkbox-primary checkbox-sm mt-0.5"
          />
          <label htmlFor="consent" className="cursor-pointer select-none leading-relaxed">
            I confirm that a parent or guardian has consented to this registration. Personal information collected is
            used solely for academic support purposes in accordance with RA 10173 (Data Privacy Act of 2012) and our{" "}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="lp-link underline"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            . <span className="text-error">*</span>
          </label>
        </div>
        <div data-field-feedback />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              <span>Creating account...</span>
            </>
          ) : (
            <span>{copy.buttonLabel}</span>
          )}
        </button>
      </ValidatedForm>

      <p className="lp-form-foot">
        Already have an account?{" "}
        <Link href="/login" className="lp-link">
          Log in
        </Link>
      </p>
    </div>
  );
}
