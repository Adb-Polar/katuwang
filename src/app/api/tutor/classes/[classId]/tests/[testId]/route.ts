import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClassTestSchema } from "@/lib/validations/classTest";
import { isAccessError, loadOwnedTest } from "@/lib/classTestAccess";
import { serializeClassTest } from "@/lib/classTestSerialize";

type Ctx = { params: Promise<{ classId: string; testId: string }> };

// ─── GET: Full Test (ordered questions with options) ──────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
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

    return NextResponse.json(serializeClassTest(owned.test));
  } catch (error) {
    console.error("Error fetching class test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── PATCH: Edit Title / Instructions (DRAFT only) ────────────────────────
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

    if (owned.test.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only a draft test can be edited." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const result = updateClassTestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { title, instructions } = result.data;
    const updated = await prisma.classTest.update({
      where: { id: testId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(instructions !== undefined ? { instructions: instructions || null } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating class test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── DELETE: Remove a Draft Test ─────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
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

    if (owned.test.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only a draft test can be deleted." },
        { status: 409 }
      );
    }

    await prisma.classTest.delete({ where: { id: testId } });
    return NextResponse.json({ message: "Test deleted." });
  } catch (error) {
    console.error("Error deleting class test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
