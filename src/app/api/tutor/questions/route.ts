import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorTutorQuestionSchema } from "@/lib/validations/sessionTest";
import { isAccessError, loadOwnedClass } from "@/lib/sessionTestAccess";

// ─── GET: The Tutor's Own Custom Questions ────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic")?.trim() || "";

    const questions = await prisma.assessmentQuestion.findMany({
      where: {
        origin: "TUTOR",
        ownerTutorProfileId: tutorProfile.id,
        ...(topic ? { topic } : {}),
      },
      include: { options: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error listing tutor questions:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: Author a Custom Question for a Session Test ────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = authorTutorQuestionSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { classId, topic, prompt, explanation, options } = result.data;

    const owned = await loadOwnedClass(session.user.id, classId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    if (!owned.tutorClass.topics.some((t) => t.topic === topic)) {
      return NextResponse.json(
        { error: "Topic must be one of the class's topics." },
        { status: 400 }
      );
    }

    const question = await prisma.assessmentQuestion.create({
      data: {
        subject: owned.tutorClass.subject,
        topic,
        prompt,
        explanation: explanation || null,
        origin: "TUTOR",
        createdById: session.user.id,
        ownerTutorProfileId: owned.tutorProfile.id,
        options: {
          create: options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })),
        },
      },
      include: { options: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating tutor question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
