import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET: List Admin Moderation Action History ────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        admin: { select: { anonymousId: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
