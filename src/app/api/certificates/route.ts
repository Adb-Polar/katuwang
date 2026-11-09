import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveServerSession } from "@/lib/serverSession";
import { isAdminRole } from "@/lib/permissions";
import { certificateListSelect } from "@/lib/certificates/access";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
const filters = z.object({
  q: z.string().trim().max(100).default(""), subject: z.string().trim().max(191).default(""),
  classId: z.string().max(191).default(""), classCode: z.string().trim().max(191).default(""),
  issuedFrom: z.iso.date().optional(), issuedTo: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).refine(v => !v.issuedFrom || !v.issuedTo || v.issuedFrom <= v.issuedTo, "Issue date range is invalid.");
export async function GET(req: NextRequest) {
  const session = await getActiveServerSession();
  if (!session || (session.user.role !== "STUDENT_LEARNER" && !isAdminRole(session.user.role))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = filters.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid certificate filters." }, { status: 400 });
  const { q, subject, classId, classCode, issuedFrom, issuedTo, page, pageSize } = parsed.data;
  const admin = isAdminRole(session.user.role);
  const where: Prisma.CompletionCertificateWhereInput = {
    ...(!admin ? { learnerId: session.user.id } : {}),
    ...(q ? { OR: [{ learnerName: { contains: q } }, { certificateNumber: { contains: q } }, { classCode: { contains: q } }] } : {}),
    ...(subject ? { subjectName: { contains: subject } } : {}),
    ...(classId ? { classId } : {}),
    ...(classCode ? { classCode: { contains: classCode } } : {}),
    // Date inputs represent Philippine calendar days, consistent with the rest of the app.
    ...(issuedFrom || issuedTo ? { issuedAt: {
      ...(issuedFrom ? { gte: new Date(`${issuedFrom}T00:00:00+08:00`) } : {}),
      ...(issuedTo ? { lt: new Date(new Date(`${issuedTo}T00:00:00+08:00`).getTime() + 86400_000) } : {}),
    } } : {}),
  };
  try {
    const [certificates, total] = await Promise.all([
      prisma.completionCertificate.findMany({ where, select: certificateListSelect, orderBy: { issuedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.completionCertificate.count({ where }),
    ]);
    // PDF readiness is separate from provider email acceptance; do not fetch blob contents to list it.
    const ready = certificates.length ? await prisma.completionCertificate.findMany({ where: { id: { in: certificates.map(c => c.id) }, pdf: { not: null } }, select: { id: true } }) : [];
    const readyIds = new Set(ready.map(c => c.id));
    return NextResponse.json({ certificates: certificates.map(c => ({ ...c, pdfReady: readyIds.has(c.id), ...(!admin ? { lastError: undefined, attempts: undefined } : {}) })), total, page, pageSize }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Certificates could not be loaded." }, { status: 500 }); }
}
