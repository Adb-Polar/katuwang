import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations/emailVerification";
import { matchesVerificationCode } from "@/lib/emailVerification";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

const INVALID = { error: "This verification code is invalid or has expired." };

// ─── POST: Confirm an email address via its one-time code ────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { email, code } = result.data;
    if (rateLimitEnabled()) {
      const byIp = rateLimit(`verify-email:ip:${clientIp(req.headers)}`, 10, 15 * MINUTE_MS);
      const byEmail = rateLimit(`verify-email:email:${email}`, 5, 15 * MINUTE_MS);
      if (!byIp.ok || !byEmail.ok) {
        return tooManyRequests(Math.max(byIp.retryAfter, byEmail.retryAfter));
      }
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true, status: true },
    });
    if (!user || user.emailVerifiedAt || user.status === "BANNED") {
      return NextResponse.json(INVALID, { status: 400 });
    }

    const record = await prisma.verificationToken.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, tokenHash: true, expiresAt: true },
    });

    const now = new Date();
    if (!record || record.expiresAt <= now || !matchesVerificationCode(email, code, record.tokenHash)) {
      return NextResponse.json(INVALID, { status: 400 });
    }

    const consumed = await prisma.$transaction(async (tx) => {
      const updated = await tx.verificationToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (updated.count !== 1) return false;
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: now },
      });
      return true;
    });
    if (!consumed) return NextResponse.json(INVALID, { status: 400 });

    return NextResponse.json({ message: "Your email address has been verified. You can now sign in." });
  } catch (error) {
    console.error("Error handling verify-email:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
