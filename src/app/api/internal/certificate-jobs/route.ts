import { NextRequest, NextResponse } from "next/server";
import { hasValidBearerToken } from "@/lib/bearerAuth";
import { processCertificateJobs } from "@/lib/certificates/jobs";
export const maxDuration = 300;
export async function POST(req: NextRequest) {
  if (!hasValidBearerToken(req.headers.get("authorization"), process.env.CERTIFICATE_JOB_SECRET)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try { return NextResponse.json(await processCertificateJobs(10)); }
  catch { return NextResponse.json({ error: "Certificate job processing failed." }, { status: 500 }); }
}
