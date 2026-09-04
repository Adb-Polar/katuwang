import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubjects } from "@/lib/subjects";

// ─── GET: active subjects + topics, for populating dropdowns ───────────────
// Any authenticated role. Cached via src/lib/subjects.ts.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const subjects = await getSubjects();
    return NextResponse.json({
      subjects: subjects.map((s) => ({
        slug: s.slug,
        name: s.name,
        topics: s.topics.map((t) => t.name),
      })),
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
