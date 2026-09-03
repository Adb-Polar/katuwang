import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_NOTIFICATIONS = 50;

// ─── GET: The caller's own notifications, newest first ──────────────────────
//   ?take=N  — clamp the page size (1..MAX_NOTIFICATIONS); the bell dropdown asks for 8
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const takeParam = Number(new URL(req.url).searchParams.get("take"));
    const take =
      Number.isFinite(takeParam) && takeParam > 0
        ? Math.min(Math.floor(takeParam), MAX_NOTIFICATIONS)
        : MAX_NOTIFICATIONS;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, readAt: null },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
