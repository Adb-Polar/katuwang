import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/passwordReset";
import { generateResetToken, hashResetToken, resetTokenExpiry } from "@/lib/passwordReset";
import { sendMail, renderPasswordResetEmail } from "@/lib/mail";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

// Neutral response — never reveals whether an account matched.
const NEUTRAL = {
  message: "If an account matches that address, we've sent a password reset link.",
};

// ─── POST: Request a password reset link ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email } = result.data;

    // Throttle so this route can't be used to email-bomb an address or spray
    // reset-token rows. Both checks answer with the same neutral 429.
    if (rateLimitEnabled()) {
      const ip = clientIp(req.headers);
      const byIp = rateLimit(`forgot:ip:${ip}`, 5, 15 * MINUTE_MS);
      const byEmail = rateLimit(`forgot:email:${email}`, 3, 15 * MINUTE_MS);
      if (!byIp.ok || !byEmail.ok) {
        return tooManyRequests(Math.max(byIp.retryAfter, byEmail.retryAfter));
      }
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { recoveryEmail: email }] },
      select: { id: true, status: true },
    });

    // Only issue a token for a usable account, but always answer identically.
    if (user && user.status !== "BANNED") {
      const rawToken = generateResetToken();

      await prisma.$transaction([
        // Invalidate any earlier unused tokens for this user.
        prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashResetToken(rawToken),
            expiresAt: resetTokenExpiry(),
          },
        }),
      ]);

      const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
      const resetUrl = `${base}/reset-password?token=${rawToken}`;
      try {
        await sendMail({ to: email, ...renderPasswordResetEmail(resetUrl) });
      } catch (err) {
        // Never surface a mail failure to the caller — the response must stay
        // neutral, or a send error leaks that this account exists.
        console.error("[password-reset] failed to send reset email:", err);
      }
    }

    return NextResponse.json(NEUTRAL, { status: 200 });
  } catch (error) {
    console.error("Error handling forgot-password:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
