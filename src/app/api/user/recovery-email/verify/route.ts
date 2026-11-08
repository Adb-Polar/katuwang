import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { matchesVerificationCode } from "@/lib/emailVerification";
import { rateLimit, rateLimitEnabled, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

class InvalidCode extends Error {}
const INVALID = { error: "This recovery verification code is invalid or has expired." };
export async function POST(req: NextRequest) {
  try {
    const session = await getActiveServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (rateLimitEnabled()) {
      const limit = rateLimit(`recovery-verify:${session.user.id}`, 10, 15 * MINUTE_MS);
      if (!limit.ok) return tooManyRequests(limit.retryAfter);
    }
    const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(INVALID, { status: 400 });
    const record = await prisma.recoveryEmailToken.findFirst({ where: { userId: session.user.id, usedAt: null }, orderBy: { createdAt: "desc" } });
    if (!record || !matchesVerificationCode(record.email, parsed.data.code, record.tokenHash)) return NextResponse.json(INVALID, { status: 400 });
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM recovery_email_tokens WHERE id = ${record.id} FOR UPDATE`;
      const now = new Date();
      const consumed = await tx.recoveryEmailToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
      if (consumed.count !== 1) throw new InvalidCode();
      const updated = await tx.user.updateMany({ where: { id: session.user.id, recoveryEmail: record.email }, data: { recoveryEmailVerifiedAt: now } });
      if (updated.count !== 1) throw new InvalidCode();
      await tx.recoveryChallenge.updateMany({
        where: { userId: session.user.id, usedAt: null }, data: { usedAt: now },
      });
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
    return NextResponse.json({ message: "Recovery email verified. You can now use it for password recovery." });
  } catch (error) {
    if (error instanceof InvalidCode) return NextResponse.json(INVALID, { status: 400 });
    console.error("Error verifying recovery email:", error);
    return NextResponse.json({ error: "Could not verify your recovery email. Please try again." }, { status: 500 });
  }
}
