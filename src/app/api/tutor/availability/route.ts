import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAvailabilitySchema } from "@/lib/validations/availability";

// ─── GET: Fetch Tutor's Weekly Availability ────────────────────────────────────
export async function GET() {
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

    const slots = await prisma.availability.findMany({
      where: { tutorProfileId: tutorProfile.id },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── PUT: Replace Tutor's Weekly Availability ──────────────────────────────────
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const result = updateAvailabilitySchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { slots } = result.data;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { tutorProfileId: tutorProfile.id } });

      if (slots.length > 0) {
        await tx.availability.createMany({
          data: slots.map((slot) => ({
            tutorProfileId: tutorProfile.id,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }

      return tx.availability.findMany({
        where: { tutorProfileId: tutorProfile.id },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating tutor availability:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
