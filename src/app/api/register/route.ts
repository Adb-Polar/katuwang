import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { getSetting } from "@/lib/settings";
import { registerAccount } from "@/lib/registration";
import { sendMail, renderVerificationEmail } from "@/lib/mail";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

// ─── Registration Handler ─────────────────────────────────────────────────────

const PENDING_MESSAGE =
  "Registration received. An administrator needs to approve your account before you can sign in.";

const VERIFY_EMAIL_MESSAGE =
  "Registration received. Check your email for a verification link before you can sign in.";

const TUTOR_SUCCESS_MESSAGE =
  "Registration successful. Start by creating your first class — you can request a topic assessment once you're teaching it.";

export async function POST(req: NextRequest) {
  try {
    if (rateLimitEnabled()) {
      const limited = rateLimit(`register:ip:${clientIp(req.headers)}`, 5, 60 * MINUTE_MS);
      if (!limited.ok) return tooManyRequests(limited.retryAfter);
    }

    const registrationOpen = await getSetting("registrationOpen");
    if (!registrationOpen) {
      return NextResponse.json({ error: "Registration is currently closed." }, { status: 403 });
    }

    const requireApproval = await getSetting("requireRegistrationApproval");
    const requireEmailVerification = await getSetting("requireEmailVerification");

    const body = await req.json();

    // Validate request body using Zod schema
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid registration inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;

    const account = await registerAccount({
      type: data.type,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      gradeLevel: data.gradeLevel,
      section: data.section,
      contactInfo: data.contactInfo || null,
      consentGiven: data.consentGiven,
      requireApproval,
      requireEmailVerification,
    });

    if (!account.ok) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    if (account.verificationToken) {
      const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
      const verifyUrl = `${base}/verify-email?token=${account.verificationToken}`;
      try {
        await sendMail({ to: data.email, ...renderVerificationEmail(verifyUrl) });
      } catch (err) {
        // Registration already succeeded — a mail failure shouldn't fail the
        // request. The account can request a new link via resend-verification.
        console.error("[register] failed to send verification email:", err);
      }
    }

    const requiresVerification = Boolean(account.verificationToken);
    const message = requiresVerification
      ? VERIFY_EMAIL_MESSAGE
      : account.pendingApproval
        ? PENDING_MESSAGE
        : data.type === "TUTOR"
          ? TUTOR_SUCCESS_MESSAGE
          : "Registration successful.";

    return NextResponse.json(
      {
        message,
        anonymousId: account.anonymousId,
        pendingApproval: account.pendingApproval,
        requiresVerification,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
