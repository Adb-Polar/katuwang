import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassAppealSchema } from "@/lib/validations/classAppeal";
import { notifyMany } from "@/lib/notifications";

// ─── POST: A tutor appeals a suspension/ban on one of their classes ──────────
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

    const body = await req.json();
    const result = createClassAppealSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const [tutorProfile, existingClass] = await Promise.all([
      prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true, user: { select: { anonymousId: true } } },
      }),
      prisma.tutorClass.findUnique({
        where: { id: classId },
        select: { id: true, status: true, tutorProfileId: true, code: true, subject: true },
      }),
    ]);

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (!tutorProfile || existingClass.tutorProfileId !== tutorProfile.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (existingClass.status !== "SUSPENDED" && existingClass.status !== "BANNED") {
      return NextResponse.json(
        { error: "Only a suspended or banned class can be appealed." },
        { status: 400 }
      );
    }

    const openAppeal = await prisma.classAppeal.findFirst({
      where: { classId, status: "PENDING" },
      select: { id: true },
    });

    if (openAppeal) {
      return NextResponse.json(
        { error: "An appeal for this class is already awaiting review." },
        { status: 409 }
      );
    }

    const appeal = await prisma.$transaction(async (tx) => {
      const created = await tx.classAppeal.create({
        data: {
          classId,
          tutorProfileId: tutorProfile.id,
          reason: result.data.reason,
        },
      });

      // Let every active admin know there's an appeal waiting for review.
      const admins = await tx.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await notifyMany(
        tx,
        admins.map((a) => a.id),
        "CLASS_APPEAL_NEW",
        `${tutorProfile.user.anonymousId} appealed the moderation on ${existingClass.subject} · ${existingClass.code}.`,
        "/admin/class-appeals"
      );

      return created;
    });

    return NextResponse.json(appeal, { status: 201 });
  } catch (error) {
    console.error("Error filing class appeal:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
