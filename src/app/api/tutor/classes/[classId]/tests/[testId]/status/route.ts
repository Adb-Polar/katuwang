import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classTestStatusSchema } from "@/lib/validations/classTest";
import { isAccessError, loadOwnedTest } from "@/lib/classTestAccess";

type Ctx = { params: Promise<{ classId: string; testId: string }> };

// ─── PATCH: Publish or Close a Test ──────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, testId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedTest(session.user.id, classId, testId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const body = await req.json();
    const result = classTestStatusSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { status } = result.data;
    const now = new Date();

    if (status === "PUBLISHED") {
      if (owned.test.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Only a draft test can be published." },
          { status: 409 }
        );
      }
      if (owned.test.questions.length === 0) {
        return NextResponse.json(
          { error: "Add at least one question before publishing." },
          { status: 400 }
        );
      }
      const updated = await prisma.classTest.update({
        where: { id: testId },
        data: { status: "PUBLISHED", publishedAt: now },
      });
      return NextResponse.json(updated);
    }

    // status === "CLOSED"
    if (owned.test.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Only a published test can be closed." },
        { status: 409 }
      );
    }
    const updated = await prisma.classTest.update({
      where: { id: testId },
      data: { status: "CLOSED", closedAt: now },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating class test status:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
