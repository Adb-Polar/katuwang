import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/profile";
import { recoveryEmailUpdateData, RecoveryEmailError } from "@/lib/recoveryEmail";
import { generateVerificationCode, hashVerificationCode, verificationCodeExpiry } from "@/lib/emailVerification";
import { sendMail } from "@/lib/mail";
import { rateLimit, rateLimitEnabled, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

const select = { recoveryEmail: true, recoveryEmailVerifiedAt: true } as const;
export async function GET() {
  const session = await getActiveServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select }));
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getActiveServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const parsed = updateProfileSchema.pick({ recoveryEmail: true, currentPassword: true }).safeParse(await req.json());
    if (!parsed.success || parsed.data.recoveryEmail === undefined) return NextResponse.json({ error: "Enter a valid recovery email, or leave it empty to remove it." }, { status: 400 });
    const data = await recoveryEmailUpdateData(session.user.id, parsed.data.recoveryEmail, parsed.data.currentPassword);
    return NextResponse.json(await prisma.user.update({ where: { id: session.user.id }, data, select }));
  } catch (error) {
    if (error instanceof RecoveryEmailError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Error updating recovery email:", error);
    return NextResponse.json({ error: "Could not update your recovery email. Please try again." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getActiveServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (rateLimitEnabled()) {
      const limit = rateLimit(`recovery-send:${session.user.id}`, 3, 15 * MINUTE_MS);
      if (!limit.ok) return tooManyRequests(limit.retryAfter);
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select });
    if (!user.recoveryEmail) return NextResponse.json({ error: "Save a recovery email first." }, { status: 400 });
    if (user.recoveryEmailVerifiedAt) return NextResponse.json({ message: "Your recovery email is already verified." });
    const code = generateVerificationCode();
    await prisma.$transaction(async tx => {
      await tx.recoveryEmailToken.updateMany({ where: { userId: session.user.id, usedAt: null }, data: { usedAt: new Date() } });
      await tx.recoveryEmailToken.create({ data: { userId: session.user.id, email: user.recoveryEmail!, tokenHash: hashVerificationCode(user.recoveryEmail!, code), expiresAt: verificationCodeExpiry() } });
    });
    try {
      await sendMail({ to: user.recoveryEmail, subject: "Verify your Katuwang recovery email", text: `Your recovery email verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this message.`, html: `<p>Your recovery email verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. If you did not request this, ignore this message.</p>` });
    } catch {
      return NextResponse.json({ error: "Could not send the verification code. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ message: "Verification code sent to your recovery email. It expires in 10 minutes." });
  } catch (error) {
    console.error("Error sending recovery verification:", error);
    return NextResponse.json({ error: "Could not send the verification code. Please try again." }, { status: 500 });
  }
}
