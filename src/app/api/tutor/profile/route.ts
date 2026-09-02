import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTutorProfileSchema } from "@/lib/validations/profile";

// ─── PATCH: Update Own Editable Profile Fields ─────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = updateTutorProfileSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { contactInfo, section } = result.data;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(contactInfo !== undefined ? { contactInfo: contactInfo || null } : {}),
        ...(section !== undefined ? { section } : {}),
      },
      select: { contactInfo: true, section: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating tutor profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
