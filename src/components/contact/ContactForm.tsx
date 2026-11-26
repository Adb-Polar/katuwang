"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import ValidatedForm from "@/components/ui/ValidatedForm";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import CharCount from "@/components/ui/CharCount";
import { reportServerFieldErrors } from "@/lib/formValidation";
import { EMAIL_INPUT_MESSAGE, EMAIL_INPUT_PATTERN } from "@/lib/validations/email";
import {
  CONTACT_CATEGORIES,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  type ContactCategoryValue,
} from "@/lib/validations/contact";

export default function ContactForm({ initialCategory }: { initialCategory?: ContactCategoryValue }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<ContactCategoryValue | "">(initialCategory ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    const form = e.currentTarget;
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(form, data)) return;
      if (!res.ok) throw new Error(data.error || "Your message could not be sent.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="lp-status-icon bg-success/15 text-success mb-0">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
          <p>
            Your message was sent. An administrator will reply to <strong>{email.trim()}</strong>, usually within a
            school day.
          </p>
        </div>
        <p className="lp-form-foot">
          <Link href="/login" className="lp-link">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 empty:hidden">
        <FeedbackBanner variant="error" message={error || null} />
      </div>
      <ValidatedForm onSubmit={submit} className="lp-form">
        <FormField size="md" label="Your name" required>
          <input
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            autoCapitalize="words"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sending}
            className="input input-bordered w-full"
          />
        </FormField>
        <FormField size="md" label="Email address" required hint="We reply here. If it is about an account, use that account's email.">
          <input
            name="email"
            type="email"
            required
            maxLength={191}
            autoComplete="email"
            pattern={EMAIL_INPUT_PATTERN}
            title={EMAIL_INPUT_MESSAGE}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
            className="input input-bordered w-full"
          />
        </FormField>
        <FormField size="md" label="What is it about?" required>
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as ContactCategoryValue)}
            disabled={sending}
            className="select select-bordered w-full"
          >
            <option value="" disabled>
              Choose one
            </option>
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField size="md" label="Message" required hint="Say what happened and what you need. Never include your password.">
          <textarea
            name="message"
            required
            rows={5}
            minLength={CONTACT_MESSAGE_MIN}
            maxLength={CONTACT_MESSAGE_MAX}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            className="textarea textarea-bordered w-full"
          />
          <CharCount value={message} max={CONTACT_MESSAGE_MAX} />
        </FormField>
        <button type="submit" disabled={sending} className="btn btn-primary w-full mt-2">
          {sending ? "Sending…" : "Send message"}
        </button>
      </ValidatedForm>
      <p className="lp-form-foot">
        <Link href="/login" className="lp-link">
          Back to log in
        </Link>
      </p>
    </>
  );
}
