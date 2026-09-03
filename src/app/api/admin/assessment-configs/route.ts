import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateGlobalAssessmentConfigSchema } from "@/lib/validations/assessment";
import { getAssessmentConfig, ASSESSMENT_SETTING_KEYS } from "@/lib/settings";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── GET: The global assessment config ─────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json(await getAssessmentConfig());
  } catch (error) {
    console.error("Error reading global assessment config:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── PATCH: Update the global assessment config ────────────────────────────
// One platform-wide value per field, stored as PlatformSetting rows.
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = updateGlobalAssessmentConfigSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { questionCount, passPercent, minBankSize } = result.data;
    const updates: { key: string; value: number }[] = [
      ...(questionCount !== undefined ? [{ key: ASSESSMENT_SETTING_KEYS.questionCount, value: questionCount }] : []),
      ...(passPercent !== undefined ? [{ key: ASSESSMENT_SETTING_KEYS.passPercent, value: passPercent }] : []),
      ...(minBankSize !== undefined ? [{ key: ASSESSMENT_SETTING_KEYS.minBankSize, value: minBankSize }] : []),
    ];

    await prisma.$transaction([
      ...updates.map((u) =>
        prisma.platformSetting.upsert({
          where: { key: u.key },
          update: { value: String(u.value) },
          create: { key: u.key, value: String(u.value) },
        })
      ),
      prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.ASSESSMENT_CONFIG_UPDATED,
          targetType: AUDIT_TARGET_TYPES.ASSESSMENT_CONFIG,
          targetId: "global",
          reason: updates.map((u) => `${u.key}=${u.value}`).join(", "),
        },
      }),
    ]);

    return NextResponse.json(await getAssessmentConfig());
  } catch (error) {
    console.error("Error updating global assessment config:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
