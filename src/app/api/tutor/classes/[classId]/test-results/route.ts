import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAccessError, loadOwnedClass } from "@/lib/sessionTestAccess";
import { buildClassSessionTestRollup } from "@/lib/sessionTestResults";

// ─── GET: Class Roll-up — chart (a) pre-vs-post average per session ───────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedClass(session.user.id, classId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const rollup = await buildClassSessionTestRollup(classId);
    if (!rollup) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    return NextResponse.json(rollup);
  } catch (error) {
    console.error("Error building class session-test roll-up:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
