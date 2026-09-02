import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveQuestionRequestSchema } from "@/lib/validations/assessment";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── PATCH: Resolve or Dismiss a Question Request ───────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { requestId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.questionRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, subject: true, topic: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Question request not found." }, { status: 404 });
    }

    if (existing.status !== "OPEN") {
      return NextResponse.json(
        { error: "Only an open request can be resolved." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = resolveQuestionRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { status, resolutionNote } = result.data;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.questionRequest.update({
        where: { id: requestId },
        data: {
          status,
          resolvedById: session.user.id,
          resolvedAt: new Date(),
          resolutionNote: resolutionNote || null,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.QUESTION_REQUEST_RESOLVED,
          targetType: AUDIT_TARGET_TYPES.QUESTION_REQUEST,
          targetId: requestId,
          reason: `${status} — ${existing.subject} · ${existing.topic}`,
        },
      });

      return row;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error resolving question request:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
