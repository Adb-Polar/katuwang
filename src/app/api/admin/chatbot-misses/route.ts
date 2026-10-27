import { isAdminRole } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { AUDIT_PAGE_SIZE } from "@/lib/pagination";
import { getActiveServerSession } from "@/lib/serverSession";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aggregateMisses, type MissSort } from "@/lib/chatbot/misses";

const DEFAULT_PAGE_SIZE = AUDIT_PAGE_SIZE;
const SORTABLE = new Set<MissSort>(["lastSeen", "count", "firstSeen"]);
// Bounded window of most-recent misses to aggregate over — volume is low
// (rows only appear when the classifier fails) so this comfortably covers
// real usage without an unbounded query.
const MAX_ROWS = 2000;

// ─── GET: chatbot misses grouped by normalised message (admin review) ───────
export async function GET(req: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");
    const role = roleParam && (Object.values(Role) as string[]).includes(roleParam) ? (roleParam as Role) : undefined;
    const q = searchParams.get("q")?.trim() || "";
    const sortParam = searchParams.get("sort") || "lastSeen";
    const sort = (SORTABLE.has(sortParam as MissSort) ? sortParam : "lastSeen") as MissSort;
    const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const rows = await prisma.chatbotMiss.findMany({
      select: { message: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
    });

    const result = aggregateMisses(rows, { role, q, sort, dir, page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching chatbot misses:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
