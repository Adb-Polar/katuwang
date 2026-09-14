import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassRecommendationSchema } from "@/lib/validations/classRecommendation";
import { notify } from "@/lib/notifications";

// ─── GET: List Recommendations Issued for a Class ─────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const recommendations = await prisma.classRecommendation.findMany({
      where: { classId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        note: true,
        createdAt: true,
        dismissedAt: true,
        learner: { select: { anonymousId: true, gradeLevel: true, section: true } },
      },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error fetching class recommendations:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── POST: Recommend This Class to a Learner ──────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
      select: { id: true, subject: true, code: true },
    });

    if (!tutorClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = createClassRecommendationSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { learnerId, note } = result.data;

    const learner = await prisma.user.findFirst({
      where: { id: learnerId, role: "STUDENT_LEARNER" },
      select: { id: true },
    });

    if (!learner) {
      return NextResponse.json({ error: "Learner not found." }, { status: 404 });
    }

    const existing = await prisma.classRecommendation.findUnique({
      where: { classId_learnerId: { classId, learnerId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This class has already been recommended to that learner." },
        { status: 409 }
      );
    }

    const recommendation = await prisma.$transaction(async (tx) => {
      const created = await tx.classRecommendation.create({
        data: { classId, learnerId, adminId: session.user.id, note: note || null },
      });

      await notify(
        tx,
        learnerId,
        "CLASS_RECOMMENDED_BY_ADMIN",
        `An administrator recommended a ${tutorClass.subject} class (${tutorClass.code}) for you.`,
        `/learner/classes/${classId}`
      );

      return created;
    });

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error("Error creating class recommendation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
