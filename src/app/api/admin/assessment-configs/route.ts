import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTopicAssessmentConfigSchema } from "@/lib/validations/assessment";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { ASSESSMENT_DEFAULTS } from "@/lib/assessmentConfig";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── PATCH: Upsert a Per-topic Assessment Config ────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = updateTopicAssessmentConfigSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, topic, questionCount, passPercent, minBankSize } = result.data;

    if (!SUBJECT_TOPICS[subject].includes(topic)) {
      return NextResponse.json(
        { error: `"${topic}" is not a valid topic for ${subject}.` },
        { status: 400 }
      );
    }

    const row = await prisma.$transaction(async (tx) => {
      const saved = await tx.topicAssessmentConfig.upsert({
        where: { subject_topic: { subject, topic } },
        update: {
          ...(questionCount !== undefined ? { questionCount } : {}),
          ...(passPercent !== undefined ? { passPercent } : {}),
          ...(minBankSize !== undefined ? { minBankSize } : {}),
          updatedById: session.user.id,
        },
        create: {
          subject,
          topic,
          questionCount: questionCount ?? ASSESSMENT_DEFAULTS.questionCount,
          passPercent: passPercent ?? ASSESSMENT_DEFAULTS.passPercent,
          minBankSize: minBankSize ?? ASSESSMENT_DEFAULTS.minBankSize,
          updatedById: session.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.ASSESSMENT_CONFIG_UPDATED,
          targetType: AUDIT_TARGET_TYPES.ASSESSMENT_CONFIG,
          targetId: saved.id,
          reason: `${subject} · ${topic}`,
        },
      });

      return saved;
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error("Error updating topic assessment config:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
