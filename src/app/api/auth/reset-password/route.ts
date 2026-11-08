import { NextRequest } from "next/server";
import { privateJson } from "@/lib/recovery";
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
      return privateJson({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, 400);
    }

    const { token, password } = result.data;

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return privateJson(INVALID, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const changed = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${record.userId} FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: record.userId }, select: { status: true } });
      if (!user || user.status === "BANNED") return false;
      // Conditional claim is inside the same transaction as the password write.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (!claimed.count) return false;
      await tx.user.update({ where: { id: record.userId }, data: { password: hashedPassword, sessionVersion: { increment: 1 } } });
      await tx.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() },
      });
      await tx.recoveryChallenge.updateMany({
        where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() },
      });
      return true;
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
    if (!changed) return privateJson(INVALID, 400);

    return privateJson({ message: "Your password has been reset. You can now sign in." });
  } catch {
    console.error("Error handling reset-password");
    return privateJson({ error: "An unexpected error occurred. Please try again." }, 500);
  }
}
