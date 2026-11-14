import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveServerSession } from "@/lib/serverSession";
import { CertificationCatalogError, migrateCertificationCatalog } from "@/lib/certificationCatalogMigration";

const schema = z.object({ operationId: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/), reason: z.string().trim().min(20).max(1000),
  dryRun: z.boolean().default(true), confirmReplacement: z.boolean().optional(), expectedFingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional() });
export async function POST(req: NextRequest) {
  try {
    const session = await getActiveServerSession();
    if (!session || session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "An active super administrator is required." }, { status: 403 });
    if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Use the signed-in site to migrate certifications." }, { status: 403 });
    const input = schema.safeParse(await req.json());
    if (!input.success || (!input.data.dryRun && (!input.data.confirmReplacement || !input.data.expectedFingerprint))) return NextResponse.json({ error: "Provide a reason, operation ID and preview fingerprint; explicitly confirm replacement to apply." }, { status: 400 });
    return NextResponse.json(await migrateCertificationCatalog(prisma, { ...input.data, adminId: session.user.id }));
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    if (error instanceof CertificationCatalogError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Certification catalog migration failed; its transaction was rolled back.");
    return NextResponse.json({ error: "Certification replacement could not be completed. No partial replacement was saved." }, { status: 500 });
  }
}
