import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSessionTestSchema, updateSessionTestSchema } from "@/lib/validations/sessionTest";
import { isAccessError, loadOwnedSession } from "@/lib/sessionTestAccess";
import { serializeSessionTest } from "@/lib/sessionTestSerialize";
import { getSetting } from "@/lib/settings";

type Ctx = { params: Promise<{ classId: string; sessionId: string }> };

// ─── GET: This Session's Test (may not exist yet) ──────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedSession(session.user.id, classId, sessionId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    return NextResponse.json({
      session: owned.session,
      test: owned.test ? serializeSessionTest(owned.test) : null,
      attemptCount: owned.test?._count.attempts ?? 0,
    });
  } catch (error) {
    console.error("Error fetching session test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: Create the Session's Test ────────────────────────────────────
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (!(await getSetting("sessionTestsEnabled"))) {
      return NextResponse.json({ error: "Session tests are disabled." }, { status: 403 });
    }

    const owned = await loadOwnedSession(session.user.id, classId, sessionId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    if (owned.test) {
      return NextResponse.json({ error: "This session already has a test." }, { status: 409 });
    }

    const body = await req.json();
    const result = createSessionTestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { title, instructions } = result.data;
    const test = await prisma.sessionTest.create({
      data: { sessionId, title, instructions: instructions || null },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating session test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── PATCH: Edit Title / Instructions (DRAFT only) ────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedSession(session.user.id, classId, sessionId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }
    if (!owned.test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }
    if (owned.test.status !== "DRAFT") {
      return NextResponse.json({ error: "Only a draft test can be edited." }, { status: 409 });
    }

    const body = await req.json();
    const result = updateSessionTestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { title, instructions } = result.data;
    const updated = await prisma.sessionTest.update({
      where: { id: owned.test.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(instructions !== undefined ? { instructions: instructions || null } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating session test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── DELETE: Remove a Draft, Unattempted Test ────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedSession(session.user.id, classId, sessionId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }
    if (!owned.test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }
    if (owned.test.status !== "DRAFT" || owned.test._count.attempts > 0) {
      return NextResponse.json(
        { error: "Only a draft test with no attempts can be deleted." },
        { status: 409 },
      );
    }

    await prisma.sessionTest.delete({ where: { id: owned.test.id } });
    return NextResponse.json({ message: "Test deleted." });
  } catch (error) {
    console.error("Error deleting session test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
