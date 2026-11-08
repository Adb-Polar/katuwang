import { after, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashResetToken, generateResetToken, resetTokenExpiry } from "@/lib/passwordReset";
import { sendMail, renderPasswordResetEmail } from "@/lib/mail";
import { RECOVERY_COOKIE, RECOVERY_SENT, privateJson, recoveryLimit, maskEmail } from "@/lib/recovery";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify"), code: z.string().regex(/^\d{8}$/) }),
  z.object({ action: z.literal("send"), method: z.enum(["primary", "recovery"]) }),
]);
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

  if (body.action === "verify") {
    // The persistent attempt counter prevents guessing across workers/restarts.
    const attempt = await prisma.recoveryChallenge.updateMany({
      where: { id: record.id, attempts: { lt: 5 }, usedAt: null, expiresAt: { gt: new Date() } },
      data: { attempts: { increment: 1 } },
    });
    if (!attempt.count || record.codeHash !== hashResetToken(secret + body.code)) return invalid();
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || user.status === "BANNED" || user.email !== record.email) return invalid();
    await prisma.recoveryChallenge.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
    return privateJson({ primary: maskEmail(user.email), recovery: user.recoveryEmail && user.recoveryEmailVerifiedAt ? maskEmail(user.recoveryEmail) : null });
  }
  if (!record.verifiedAt) return invalid();
  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || user.status === "BANNED" || user.email !== record.email) return invalid();
  const destination = body.method === "primary" ? user.email : user.recoveryEmailVerifiedAt ? user.recoveryEmail : null;
  if (!destination) return invalid();
  const raw = generateResetToken();
  const issued = await prisma.$transaction(async tx => {
    // All reset issuance and redemption serialize on the account row.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
    const current = await tx.user.findUnique({ where: { id: user.id } });
    if (!current || current.status === "BANNED" || current.email !== record.email ||
      (body.method === "recovery" && (!current.recoveryEmailVerifiedAt || current.recoveryEmail !== destination))) return false;
    const claimed = await tx.recoveryChallenge.updateMany({
      where: { id: record.id, usedAt: null, verifiedAt: { not: null }, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (!claimed.count) return false;
    await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashResetToken(raw), expiresAt: resetTokenExpiry() } });
    return true;
  }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
  if (!issued) return invalid();
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  after(async () => {
    try { await sendMail({ to: destination, ...renderPasswordResetEmail(`${base}/reset-password#token=${raw}`) }); }
    catch { console.error("[recovery] unable to send reset email"); }
  });
  return privateJson({ message: RECOVERY_SENT });
}
