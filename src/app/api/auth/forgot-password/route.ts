import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/passwordReset";
import { generateResetToken, hashResetToken, resetTokenExpiry } from "@/lib/passwordReset";
import { sendMail, renderPasswordResetEmail } from "@/lib/mail";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}****@${domain}`;
}

// ─── POST: Request a password reset link ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { email } = result.data;

    // Throttle account lookups and reset-token creation.
    if (rateLimitEnabled()) {
      const ip = clientIp(req.headers);
      const byIp = rateLimit(`forgot:ip:${ip}`, 5, 15 * MINUTE_MS);
      const byEmail = rateLimit(`forgot:email:${email}`, 3, 15 * MINUTE_MS);
      if (!byIp.ok || !byEmail.ok) {
        return tooManyRequests(Math.max(byIp.retryAfter, byEmail.retryAfter));
      }
    }

    const users = await prisma.user.findMany({
      where: { OR: [{ email }, { recoveryEmail: email, recoveryEmailVerifiedAt: { not: null } }] },
      take: 2,
      select: { id: true, status: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "Email does not exist", fieldErrors: [{ path: ["email"], message: "Email does not exist" }] }, { status: 404 });
    }
    if (users.length !== 1) {
      return NextResponse.json({ error: "This address matches multiple accounts. Use your unique primary email or contact an administrator." }, { status: 409 });
    }
    const user = users[0];
    if (user.status === "BANNED") {
      return NextResponse.json({ error: "This account cannot reset its password. Contact an administrator." }, { status: 403 });
    }
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
      console.error("[password-reset] failed to send reset email:", err);
      return NextResponse.json({ error: "Could not send the reset link. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ message: `Password reset link sent to ${maskEmail(email)}` }, { status: 200 });
  } catch (error) {
    console.error("Error handling forgot-password:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
