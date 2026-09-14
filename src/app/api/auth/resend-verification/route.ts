import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/validations/emailVerification";
import { generateVerificationToken, hashVerificationToken, verificationTokenExpiry } from "@/lib/emailVerification";
import { sendMail, renderVerificationEmail } from "@/lib/mail";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

// Neutral response — never reveals whether an account matched or is already verified.
const NEUTRAL = {
  message: "If an account matches that address and needs verification, we've sent a new link.",
};

// ─── POST: Resend an email-verification link ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resendVerificationSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email } = result.data;

    // Throttle so this route can't be used to email-bomb an address or spray
    // verification-token rows. Both checks answer with the same neutral 429.
    if (rateLimitEnabled()) {
      const ip = clientIp(req.headers);
      const byIp = rateLimit(`resend-verify:ip:${ip}`, 5, 15 * MINUTE_MS);
      const byEmail = rateLimit(`resend-verify:email:${email}`, 3, 15 * MINUTE_MS);
      if (!byIp.ok || !byEmail.ok) {
        return tooManyRequests(Math.max(byIp.retryAfter, byEmail.retryAfter));
      }
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true, status: true },
    });

    // Only issue a token for an unverified, non-banned account, but always answer identically.
    if (user && !user.emailVerifiedAt && user.status !== "BANNED") {
      const rawToken = generateVerificationToken();

      await prisma.$transaction([
        // Invalidate any earlier unused tokens for this user.
        prisma.verificationToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.verificationToken.create({
          data: {
            userId: user.id,
            tokenHash: hashVerificationToken(rawToken),
            expiresAt: verificationTokenExpiry(),
          },
        }),
      ]);

      const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
      const verifyUrl = `${base}/verify-email?token=${rawToken}`;
      try {
        await sendMail({ to: email, ...renderVerificationEmail(verifyUrl) });
      } catch (err) {
        // Never surface a mail failure to the caller — the response must stay
        // neutral, or a send error leaks that this account exists.
        console.error("[email-verification] failed to send verification email:", err);
      }
    }

    return NextResponse.json(NEUTRAL, { status: 200 });
  } catch (error) {
    console.error("Error handling resend-verification:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
