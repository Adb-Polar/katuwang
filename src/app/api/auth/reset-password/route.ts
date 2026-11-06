import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/passwordReset";
import { hashResetToken } from "@/lib/passwordReset";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

const INVALID = { error: "This reset link is invalid or has expired." };
class InvalidResetLink extends Error {}

// ─── POST: Complete a password reset ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (rateLimitEnabled()) {
      const limited = rateLimit(`reset:ip:${clientIp(req.headers)}`, 10, 15 * MINUTE_MS);
      if (!limited.ok) return tooManyRequests(limited.retryAfter);
    }

    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { token, password } = result.data;

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return NextResponse.json(INVALID, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      // Take the lock before reading the clock, including after a competing reset.
      await tx.$queryRaw`SELECT id FROM password_reset_tokens WHERE id = ${record.id} FOR UPDATE`;
      const now = new Date();
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, userId: record.userId, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new InvalidResetLink();
      await tx.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword, sessionVersion: { increment: 1 } },
      });
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json({ message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    if (error instanceof InvalidResetLink) return NextResponse.json(INVALID, { status: 400 });
    console.error("Error handling reset-password:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
