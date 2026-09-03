import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/passwordReset";
import { generateResetToken, hashResetToken, resetTokenExpiry } from "@/lib/passwordReset";
import { sendMail, renderPasswordResetEmail } from "@/lib/mail";

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
