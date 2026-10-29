import nodemailer, { type Transporter } from "nodemailer";
import { RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { VERIFICATION_TOKEN_TTL_MS } from "@/lib/emailVerification";
import { MINUTE_MS, HOUR_MS } from "@/lib/datetime";

/** Transactional email over HTTPS (Brevo or Resend), with optional local SMTP.
 * EMAIL_PROVIDER selects brevo/resend/smtp explicitly. Without it, prefer a
 * configured Brevo key, then Resend, then SMTP. Never fall back after a failure.
 */
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || "Katuwang";
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER ||
  (BREVO_API_KEY ? "brevo" : process.env.RESEND_API_KEY ? "resend" : "smtp");
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || process.env.MAIL_FROM;

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
  if (EMAIL_PROVIDER === "brevo") return Boolean(BREVO_API_KEY && BREVO_FROM_EMAIL);
  if (EMAIL_PROVIDER === "resend") return Boolean(RESEND_API_KEY && RESEND_FROM);
  return EMAIL_PROVIDER === "smtp" && Boolean(SMTP_HOST && MAIL_FROM);
}

// Cache the transporter across dev HMR reloads, same pattern as `src/lib/prisma.ts`.
const globalForMail = globalThis as unknown as { mailTransporter: Transporter | undefined };

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
  if (EMAIL_PROVIDER === "brevo") {
    if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
      throw new Error("Brevo requires BREVO_API_KEY and BREVO_FROM_EMAIL");
    }
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Brevo email delivery failed (HTTP ${response.status})`);
    const result = await response.json() as { messageId?: string };
    if (!result.messageId) throw new Error("Brevo did not return a message ID");
    console.info("[mail] Brevo accepted email", { messageId: result.messageId });
    return;
  }
  if (EMAIL_PROVIDER === "resend") {
    if (!RESEND_API_KEY || !RESEND_FROM) throw new Error("Resend requires RESEND_API_KEY and RESEND_FROM or MAIL_FROM");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    // Do not include provider response bodies: they may contain message content.
    if (!response.ok) throw new Error(`Resend email delivery failed (HTTP ${response.status})`);
    const result = await response.json() as { id?: string };
    if (!result.id) throw new Error("Resend did not return an email ID");
    return;
  }
  if (EMAIL_PROVIDER !== "smtp") throw new Error("Unsupported EMAIL_PROVIDER");
  if (!isMailConfigured()) {
    console.info("[mail] not configured — would send:", { to: opts.to, subject: opts.subject });
    return;
  }
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
