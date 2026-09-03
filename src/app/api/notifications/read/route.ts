import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── POST: Mark notifications read ───────────────────────────────────────────
//   { ids?: string[] }  — omitted/empty = mark ALL of the caller's unread ones
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined;

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
        ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
      },
      data: { readAt: new Date() },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
