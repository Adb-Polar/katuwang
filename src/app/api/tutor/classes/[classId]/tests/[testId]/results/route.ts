import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAccessError, loadOwnedTest } from "@/lib/classTestAccess";
import { buildClassTestResults } from "@/lib/classTestResults";

type Ctx = { params: Promise<{ classId: string; testId: string }> };

// ─── GET: Per-learner Results + Pre/Post Delta ──────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, testId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedTest(session.user.id, classId, testId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const results = await buildClassTestResults(testId);
    if (!results) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error building class test results:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
