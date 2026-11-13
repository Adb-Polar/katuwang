import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveServerSession } from "@/lib/serverSession";
import { canReadCertificate } from "@/lib/certificates/access";
export async function GET(req: NextRequest, { params }: { params: Promise<{ certificateId: string }> }) {
  const session = await getActiveServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { certificateId } = await params;
  try {
    const summary = await prisma.completionCertificate.findUnique({ where: { id: certificateId }, select: { learnerId: true, certificateNumber: true } });
    if (!summary || !canReadCertificate(session.user, summary.learnerId)) return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    const c = await prisma.completionCertificate.findUnique({ where: { id: certificateId }, select: { pdf: true } });
    if (!c?.pdf) return NextResponse.json({ error: "Your certificate PDF is being prepared. Please try again later." }, { status: 409 });
    return new Response(new Uint8Array(c.pdf), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${summary.certificateNumber}.pdf"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch { return NextResponse.json({ error: "Certificate could not be downloaded." }, { status: 500 }); }
}
