import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processCertificateJobs } from "@/lib/certificates/jobs";
export const maxDuration = 300;
export async function POST(req: NextRequest) {
  const expected = process.env.CERTIFICATE_JOB_SECRET;
  const actual = req.headers.get("authorization") ?? "";
  const target = `Bearer ${expected ?? ""}`;
  if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(target) || !timingSafeEqual(Buffer.from(actual), Buffer.from(target))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try { return NextResponse.json(await processCertificateJobs(10)); }
  catch { return NextResponse.json({ error: "Certificate job processing failed." }, { status: 500 }); }
}
