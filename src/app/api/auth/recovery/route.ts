import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashResetToken, generateResetToken, resetTokenExpiry, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { RECOVERY_COOKIE, RESET_COOKIE, RESET_COOKIE_PATH, privateJson, recoveryLimit } from "@/lib/recovery";

const schema = z.object({ action: z.literal("verify"), code: z.string().regex(/^\d{8}$/) });
const invalid = () => privateJson({ error: "Invalid or expired verification. Request a new code." }, 400);

export async function POST(req: NextRequest) {
  const secret = req.cookies.get(RECOVERY_COOKIE)?.value ?? "";
  const limited = recoveryLimit(req, "recovery");
  if (limited) return limited;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !/^[a-f0-9]{64}$/.test(secret)) return invalid();
  const body = parsed.data;
  const record = await prisma.recoveryChallenge.findUnique({ where: { tokenHash: hashResetToken(secret) } });
  if (!record || record.purpose !== "ownership" || record.usedAt || record.expiresAt <= new Date()) return invalid();

  // Persist failed attempts even when verification does not authorize a reset.
  const attempt = await prisma.recoveryChallenge.updateMany({
    where: { id: record.id, attempts: { lt: 5 }, usedAt: null, expiresAt: { gt: new Date() } },
    data: { attempts: { increment: 1 } },
  });
  if (!attempt.count || record.codeHash !== hashResetToken(secret + body.code)) return invalid();

  const raw = generateResetToken();
  const issued = await prisma.$transaction(async tx => {
    // All reset issuance and redemption serialize on the account row.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${record.userId} FOR UPDATE`;
    const current = await tx.user.findUnique({ where: { id: record.userId } });
    if (!current || current.status === "BANNED" || current.email !== record.email) return false;
    const claimed = await tx.recoveryChallenge.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date(), verifiedAt: new Date() },
    });
    if (!claimed.count) return false;
    await tx.passwordResetToken.updateMany({ where: { userId: current.id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordResetToken.create({ data: { userId: current.id, tokenHash: hashResetToken(raw), expiresAt: resetTokenExpiry() } });
    return true;
  }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
  if (!issued) return invalid();
  const response = privateJson({ verified: true });
  response.cookies.set(RESET_COOKIE, raw, {
    httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "strict",
    path: RESET_COOKIE_PATH, maxAge: RESET_TOKEN_TTL_MS / 1000,
  });
  response.cookies.set(RECOVERY_COOKIE, "", { path: "/api/auth/recovery", maxAge: 0 });
  return response;
}
