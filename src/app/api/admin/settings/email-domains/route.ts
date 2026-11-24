import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_EMAIL_DOMAINS_KEY, getAllowedEmailDomains } from "@/lib/settings";
import { updateAllowedEmailDomainsSchema } from "@/lib/validations/admin";

// ─── GET: The email domains registration accepts ───────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ domains: await getAllowedEmailDomains() });
  } catch (error) {
    console.error("Error reading allowed email domains:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

// ─── PUT: Replace the accepted email domains ───────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = updateAllowedEmailDomainsSchema.safeParse(await req.json());
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const value = result.data.domains.join(",");
    await prisma.platformSetting.upsert({
      where: { key: ALLOWED_EMAIL_DOMAINS_KEY },
      update: { value },
      create: { key: ALLOWED_EMAIL_DOMAINS_KEY, value },
    });

    return NextResponse.json({ domains: result.data.domains });
  } catch (error) {
    console.error("Error updating allowed email domains:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
