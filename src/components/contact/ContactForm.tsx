"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import { CONTACT_MESSAGE_MAX, CONTACT_SUBJECTS } from "@/lib/validations/contact";

/**
 * Public "contact an administrator" form — works signed out, so people who
 * cannot log in (pending, suspended, banned) can still reach the admins.
 */
export default function ContactForm({
  initialName = "",
  initialEmail = "",
  backHref,
  backLabel,
}: {
  initialName?: string;
  initialEmail?: string;
  backHref: string;
  backLabel: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentMessage, setSentMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send your message.");
      setSentMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  };

  const backLink = (
    <div className="border-t border-base-200 pt-4 text-center">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>
    </div>
  );

  if (sentMessage) {
    return (
      <div className="card kt-card w-full max-w-md">
        <div className="card-body gap-5 text-center items-center" role="status">
          <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="font-sans text-xl font-semibold">Message sent</h1>
          <p className="text-xs text-base-content/70 leading-relaxed">{sentMessage}</p>
          <div className="w-full">{backLink}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card kt-card w-full max-w-md">
      <div className="card-body gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandMark />
          <h1 className="font-sans text-xl font-semibold">Contact an administrator</h1>
          <p className="text-xs text-base-content/60">
            Can&apos;t sign in, or have a concern about your account? Send the admins a message and they will reply by
            email.
          </p>
        </div>

        <FeedbackBanner variant="error" message={error || null} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Your name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className="input input-bordered input-sm w-full text-xs focus:input-primary"
            />
          </FormField>

          <FormField label="Email address" required hint="Use the email on your Katuwang account if you have one.">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input input-bordered input-sm w-full text-xs focus:input-primary"
            />
          </FormField>

          <FormField label="What is this about?" required>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="select select-bordered select-sm w-full text-xs"
            >
              <option value="" disabled>
                Choose a topic
              </option>
              {CONTACT_SUBJECTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Message" required>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              maxLength={CONTACT_MESSAGE_MAX}
              rows={5}
              placeholder="Describe what happened and what you need help with."
              className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
            />
            <CharCount value={message} max={CONTACT_MESSAGE_MAX} />
          </FormField>

          {/* Honeypot — invisible to people and skipped by keyboard and screen readers. */}
          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          <button type="submit" disabled={sending} className="btn btn-primary btn-sm w-full text-xs">
            {sending && <span className="loading loading-spinner loading-xs" />}
            Send message
          </button>
        </form>

        {backLink}
      </div>
    </div>
  );
}
