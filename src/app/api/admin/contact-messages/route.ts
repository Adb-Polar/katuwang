import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ContactMessageStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";

const STATUSES: ContactMessageStatus[] = ["OPEN", "RESOLVED"];

// ─── GET: Messages sent through the public contact form ────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as ContactMessageStatus | null;
    const status = statusParam && STATUSES.includes(statusParam) ? statusParam : undefined;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize")) || ADMIN_PAGE_SIZE));

    const where = status ? { status } : {};
    const [messages, total, openCount, resolvedCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          message: true,
          status: true,
          adminNote: true,
          resolvedAt: true,
          createdAt: true,
          sender: { select: { id: true, anonymousId: true, role: true, status: true } },
          resolvedBy: { select: { anonymousId: true } },
        },
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count({ where: { status: "OPEN" } }),
      prisma.contactMessage.count({ where: { status: "RESOLVED" } }),
    ]);

    return NextResponse.json({
      messages,
      total,
      page,
      pageSize,
      counts: { OPEN: openCount, RESOLVED: resolvedCount },
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
