import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAccessError, loadOwnedSession } from "@/lib/sessionTestAccess";
import { buildSessionTestResults } from "@/lib/sessionTestResults";

type Ctx = { params: Promise<{ classId: string; sessionId: string }> };

// ─── GET: Results — charts (c) per-question rate + (d) per-learner delta ───
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedSession(session.user.id, classId, sessionId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }
    if (!owned.test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    const results = await buildSessionTestResults(owned.test.id);
    if (!results) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error building session test results:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
