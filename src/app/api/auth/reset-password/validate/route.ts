import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/passwordReset";
import { RESET_COOKIE, privateJson, recoveryLimit } from "@/lib/recovery";

export async function POST(req: NextRequest) {
  const limited = recoveryLimit(req, "reset-validate");
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const raw = body?.token ?? req.cookies.get(RESET_COOKIE)?.value;
  if (typeof raw !== "string" || !/^[a-f0-9]{64}$/.test(raw)) {
    return privateJson({ error: "This password reset authorization is invalid or has expired. Request a new code." }, 400);
  }
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(raw) },
    select: { usedAt: true, expiresAt: true, user: { select: { status: true } } },
  });
  if (!token || token.usedAt || token.expiresAt <= new Date() || token.user.status === "BANNED") {
    return privateJson({ error: "This password reset authorization is invalid or has expired. Request a new code." }, 400);
  }
  return privateJson({ valid: true });
}
