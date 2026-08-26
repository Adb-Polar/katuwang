import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET: List Pending Topic Certification Requests ───────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const certifications = await prisma.topicCertification.findMany({
      where: { status: "PENDING" },
      include: {
        tutorProfile: {
          select: {
            user: { select: { id: true, anonymousId: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { requestedAt: "asc" },
    });

    return NextResponse.json(
      certifications.map(({ tutorProfile, ...c }) => ({
        ...c,
        tutor: tutorProfile.user,
      }))
    );
  } catch (error) {
    console.error("Error fetching pending certifications:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
