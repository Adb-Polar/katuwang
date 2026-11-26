import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";
import { requireAdminSession } from "@/lib/permissions";

// ─── GET: Contact-form messages (open first by default) ─────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") === "HANDLED" ? "HANDLED" : "OPEN";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize")) || ADMIN_PAGE_SIZE));

    const [messages, total, openCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where: { status },
        // Oldest open message first (longest waiting); most recently handled first.
        orderBy: status === "OPEN" ? { createdAt: "asc" } : { handledAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          category: true,
          message: true,
          status: true,
          createdAt: true,
          handledAt: true,
          handledBy: { select: { anonymousId: true } },
        },
      }),
      prisma.contactMessage.count({ where: { status } }),
      prisma.contactMessage.count({ where: { status: "OPEN" } }),
    ]);

    return NextResponse.json({ messages, total, page, pageSize, openCount });
  } catch (error) {
    console.error("Error listing contact messages:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
