import { NextRequest, NextResponse } from "next/server";
import { hasValidBearerToken } from "@/lib/bearerAuth";
import { prisma } from "@/lib/prisma";
import { queueStats } from "@/lib/requestQueue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(req: NextRequest) {
  if (!hasValidBearerToken(req.headers.get("authorization"), process.env.HEALTH_CHECK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: NO_STORE });
  }

  try {
    // Lightweight database connectivity verification
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        database: "connected",
        queues: queueStats(),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: NO_STORE,
      }
    );
  } catch (error) {
    // Log diagnostics server-side; do not expose internal error details to clients
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: NO_STORE,
      }
    );
  }
}
