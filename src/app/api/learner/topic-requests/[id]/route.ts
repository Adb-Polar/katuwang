import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelTopicRequestSchema } from "@/lib/validations/match";

// ─── PATCH: Cancel one's own open topic request ─────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = cancelTopicRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const existing = await prisma.topicRequest.findUnique({
      where: { id },
      select: { learnerId: true, status: true },
    });

    if (!existing || existing.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (existing.status !== "OPEN") {
      return NextResponse.json(
        { error: "Only an open request can be cancelled." },
        { status: 400 }
      );
    }

    const updated = await prisma.topicRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error cancelling topic request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
