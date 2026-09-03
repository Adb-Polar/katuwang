import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateTopicRequestSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { notify } from "@/lib/notifications";

// ─── PATCH: Close (→ CANCELLED) or re-open (→ OPEN) a topic request ─────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.topicRequest.findUnique({
      where: { id },
      select: { id: true, status: true, learnerId: true, subject: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = moderateTopicRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    const { status, reason } = result.data;

    if (status === "CANCELLED" && (existing.status === "CANCELLED" || existing.status === "FULFILLED")) {
      return NextResponse.json(
        { error: "This request is already in a terminal state." },
        { status: 400 }
      );
    }

    if (status === "OPEN" && existing.status !== "CANCELLED" && existing.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Only a cancelled or accepted request can be re-opened." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.topicRequest.update({
        where: { id },
        data: { status, fulfilledClassId: null },
        select: { id: true, status: true },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.TOPIC_REQUEST_STATUS_CHANGE,
          targetType: AUDIT_TARGET_TYPES.TOPIC_REQUEST,
          targetId: id,
          reason: reason || null,
        },
      });

      if (status === "CANCELLED") {
        await notify(
          tx,
          existing.learnerId,
          "TOPIC_REQUEST_REOPENED",
          `Your ${existing.subject} topic request was closed by an administrator.${reason ? ` Reason: ${reason}` : ""}`,
          "/learner/requests"
        );
      } else {
        await notify(
          tx,
          existing.learnerId,
          "TOPIC_REQUEST_REOPENED",
          `Your ${existing.subject} topic request was re-opened by an administrator.`,
          "/learner/requests"
        );
      }

      return updatedRequest;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error moderating topic request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
