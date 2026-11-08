import { after, NextRequest } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/passwordReset";
import { generateResetToken, hashResetToken, resetTokenExpiry } from "@/lib/passwordReset";
import { sendMail, renderRecoveryCodeEmail } from "@/lib/mail";
import { RECOVERY_COOKIE, OWNERSHIP_SENT, privateJson, recoveryLimit } from "@/lib/recovery";

// Account lookup and SMTP happen after the identical public response, preventing
// both option-based and lookup/mail-latency account enumeration.
export async function POST(req: NextRequest) {
  const result = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) return privateJson({ error: "Enter a valid primary email address." }, 400);
  const { email, method } = result.data;
  const limited = recoveryLimit(req, "forgot", hashResetToken(email), true, method);
  if (limited) return limited;
  const secret = generateResetToken();
  const response = privateJson({ message: OWNERSHIP_SENT });
  response.cookies.set(RECOVERY_COOKIE, secret, {
    httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "strict",
    path: "/api/auth/recovery", maxAge: 15 * 60,
  });
  after(async () => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.status === "BANNED") return;
      const destination = method === "primary" ? user.email :
        user.recoveryEmailVerifiedAt ? user.recoveryEmail : null;
      if (!destination) return;
      const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
      await prisma.recoveryChallenge.create({ data: {
        userId: user.id, purpose: "ownership", email: user.email,
        tokenHash: hashResetToken(secret), codeHash: hashResetToken(secret + code),
        expiresAt: resetTokenExpiry(),
      } });
      await sendMail({ to: destination, ...renderRecoveryCodeEmail(code) });
    } catch {
      // Transport errors may contain message bodies/tokens; never log them.
      console.error("[recovery] unable to send ownership code");
    }
  });
  return response;
}
