import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassTestSchema } from "@/lib/validations/classTest";
import { isAccessError, loadOwnedClass } from "@/lib/classTestAccess";

// ─── GET: This Class's Pre/Post Tests ──────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedClass(session.user.id, classId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const tests = await prisma.classTest.findMany({
      where: { classId },
      orderBy: { kind: "asc" },
      select: {
        id: true,
        kind: true,
        title: true,
        instructions: true,
        status: true,
        publishedAt: true,
        closedAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("Error listing class tests:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: Create a Pre or Post Test ──────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedClass(session.user.id, classId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    if (owned.tutorClass.status === "SUSPENDED" || owned.tutorClass.status === "BANNED") {
      return NextResponse.json(
        { error: "This class was suspended or banned by an administrator." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = createClassTestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { kind, title, instructions } = result.data;

    const existing = await prisma.classTest.findUnique({
      where: { classId_kind: { classId, kind } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `This class already has a ${kind.toLowerCase()}-test.` },
        { status: 409 }
      );
    }

    const test = await prisma.classTest.create({
      data: { classId, kind, title, instructions: instructions || null },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating class test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
