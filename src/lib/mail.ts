import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { VERIFICATION_TOKEN_TTL_MS } from "@/lib/emailVerification";
import { MINUTE_MS, HOUR_MS } from "@/lib/datetime";

/**
 * Transactional email service.
 *
 * Supported Providers:
 * 1. Resend (HTTP REST API over port 443 — works on Render Free & Paid tiers):
 *    - RESEND_API_KEY: required to use Resend
 *    - RESEND_FROM:    optional sender (defaults to MAIL_FROM or "Katuwang <onboarding@resend.dev>")
 *
 * 2. Plain SMTP via Nodemailer (blocked on Render Free tier, allowed on Paid tier):
 *    - SMTP_HOST:    required to send via SMTP
 *    - SMTP_PORT:    default 587
 *    - SMTP_SECURE:  "true" for TLS-on-connect; defaults to true only on port 465
 *    - SMTP_USER:    optional (omit for an open relay)
 *    - SMTP_PASS:    optional
 *    - MAIL_FROM:    required for SMTP, e.g. "Katuwang <no-reply@example.com>"
 *
 * When neither Resend nor SMTP is configured, `sendMail` logs what it would have sent
 * and returns gracefully — so local development works with zero setup.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM;

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : SMTP_PORT === 465;
const MAIL_FROM = process.env.MAIL_FROM;

/** True when there is enough configuration to actually send an email. */
export function isMailConfigured(): boolean {
  if (Boolean(RESEND_API_KEY)) {
    return true;
  }
  return Boolean(SMTP_HOST && MAIL_FROM);
}

// Cache clients across dev HMR reloads, same pattern as `src/lib/prisma.ts`.
const globalForMail = globalThis as unknown as {
  mailTransporter: Transporter | undefined;
  resendClient: Resend | undefined;
};

function getResendClient(): Resend {
  if (!globalForMail.resendClient) {
    globalForMail.resendClient = new Resend(RESEND_API_KEY);
  }
  return globalForMail.resendClient;
}

function getTransporter(): Transporter {
  if (!globalForMail.mailTransporter) {
    globalForMail.mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  return globalForMail.mailTransporter;
}

/** A rendered email: HTML body plus a plain-text fallback. */
export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends one email. No-ops with a log line when the mailer is unconfigured.
 * Throws on transport failure — the caller decides whether that is fatal.
 */
export async function sendMail(opts: { to: string } & MailContent): Promise<void> {
  if (!isMailConfigured()) {
    console.info("[mail] not configured — would send:", { to: opts.to, subject: opts.subject });
    return;
  }

  // Priority 1: Resend (HTTPS over Port 443 — guaranteed compatibility with Render)
  if (RESEND_API_KEY) {
    const from = RESEND_FROM || MAIL_FROM || "Katuwang <onboarding@resend.dev>";
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    if (error) {
      console.error("[resend] failed to send email:", error);
      throw new Error(`Resend email delivery failed: ${error.message} (${error.name})`);
    }

    return;
  }

  // Priority 2: SMTP via Nodemailer
  await getTransporter().sendMail({
    from: MAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

const RESET_TTL_MINUTES = Math.round(RESET_TOKEN_TTL_MS / MINUTE_MS);

/** Password-reset email body for a ready-to-use reset link. */
export function renderPasswordResetEmail(resetUrl: string): MailContent {
  const subject = "Reset your Katuwang password";
  const text = [
    "We received a request to reset your Katuwang password.",
    "",
    "Open this link to choose a new one:",
    resetUrl,
    "",
    `This link expires in ${RESET_TTL_MINUTES} minutes and can be used once.`,
    "If you didn't request this, you can ignore this email — your password stays the same.",
  ].join("\n");

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:520px">
  <h1 style="font-size:18px;margin:0 0 12px">Reset your Katuwang password</h1>
  <p style="margin:0 0 16px">We received a request to reset your password. Choose a new one here:</p>
  <p style="margin:0 0 16px">
    <a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#4338ca;color:#fff;text-decoration:none;border-radius:6px">Reset password</a>
  </p>
  <p style="margin:0 0 16px;word-break:break-all;color:#4b5563">Or paste this link into your browser:<br>${resetUrl}</p>
  <p style="margin:0;color:#6b7280;font-size:13px">This link expires in ${RESET_TTL_MINUTES} minutes and can be used once. If you didn't request this, you can ignore this email — your password stays the same.</p>
</div>`;

  return { subject, html, text };
}

const VERIFICATION_TTL_HOURS = Math.round(VERIFICATION_TOKEN_TTL_MS / HOUR_MS);

/** Email-verification message for a ready-to-use verify link. */
export function renderVerificationEmail(verifyUrl: string): MailContent {
  const subject = "Verify your Katuwang email address";
  const text = [
    "Welcome to Katuwang! Confirm your email address to finish setting up your account.",
    "",
    "Open this link to verify:",
    verifyUrl,
    "",
    `This link expires in ${VERIFICATION_TTL_HOURS} hours and can be used once.`,
    "If you didn't create this account, you can ignore this email.",
  ].join("\n");

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:520px">
  <h1 style="font-size:18px;margin:0 0 12px">Verify your Katuwang email address</h1>
  <p style="margin:0 0 16px">Welcome to Katuwang! Confirm your email address to finish setting up your account.</p>
  <p style="margin:0 0 16px">
    <a href="${verifyUrl}" style="display:inline-block;padding:10px 18px;background:#4338ca;color:#fff;text-decoration:none;border-radius:6px">Verify email</a>
  </p>
  <p style="margin:0 0 16px;word-break:break-all;color:#4b5563">Or paste this link into your browser:<br>${verifyUrl}</p>
  <p style="margin:0;color:#6b7280;font-size:13px">This link expires in ${VERIFICATION_TTL_HOURS} hours and can be used once. If you didn't create this account, you can ignore this email.</p>
</div>`;

  return { subject, html, text };
}
