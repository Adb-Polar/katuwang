import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/passwordReset";
import { hashResetToken } from "@/lib/passwordReset";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

const INVALID = { error: "This reset link is invalid or has expired." };

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
      return NextResponse.json({ error: errorMsg }, { status: 400 });
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

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    console.error("Error handling reset-password:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
