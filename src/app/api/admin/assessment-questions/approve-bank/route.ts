import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveServerSession } from "@/lib/serverSession";
import { isAdminRole } from "@/lib/permissions";
import { approveBankForAssessments } from "@/lib/administrativeQuestionApproval";
import { QuestionWriteError } from "@/lib/questionLocks";
import { catalogFailureResponse } from "@/lib/catalogError";
const input = z.object({ reason: z.string().trim().min(20).max(1000), administrativeApproval: z.literal(true), dryRun: z.boolean().optional().default(false) });
export async function POST(req: NextRequest) {
  try {
    const session = await getActiveServerSession();
    if (!session || !isAdminRole(session.user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const parsed = input.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Provide the administrator's reason and explicit approval for assessment use." }, { status: 400 });
    return NextResponse.json(await approveBankForAssessments(prisma, session.user.id, parsed.data.reason, parsed.data.dryRun));
  } catch (error) {
    const catalogFailure = catalogFailureResponse(error); if (catalogFailure) return catalogFailure;
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Administrative assessment approval failed.");
    return NextResponse.json({ error: "Assessment approval could not be completed. No partial approval was saved." }, { status: 500 });
  }
}
