import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/passwordReset";
import { privateJson, recoveryLimit } from "@/lib/recovery";

export async function POST(req: NextRequest) {
  const limited = recoveryLimit(req, "reset-validate");
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  if (typeof body?.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) {
    return privateJson({ error: "This reset link is invalid or has expired." }, 400);
  }
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(body.token) },
    select: { usedAt: true, expiresAt: true, user: { select: { status: true } } },
  });
  if (!token || token.usedAt || token.expiresAt <= new Date() || token.user.status === "BANNED") {
    return privateJson({ error: "This reset link is invalid or has expired." }, 400);
  }
  return privateJson({ valid: true });
}
