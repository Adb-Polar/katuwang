import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { scheduleCertificateJobs } from "@/lib/certificates/background";
export async function POST(req: NextRequest, { params }: { params: Promise<{ certificateId: string }> }) {
  const session = await getActiveServerSession();
  if (!session || !isAdminRole(session.user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { certificateId } = await params;
  try {
    const updated = await prisma.completionCertificate.updateMany({
      where: { id: certificateId, emailStatus: "FAILED" },
      data: { emailStatus: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastError: null },
    });
    if (!updated.count) return NextResponse.json({ error: "Only a failed delivery can be retried." }, { status: 409 });
    scheduleCertificateJobs();
    return NextResponse.json({ message: "Certificate delivery queued for retry." }, { status: 202 });
  } catch { return NextResponse.json({ error: "Delivery could not be queued." }, { status: 500 }); }
}
