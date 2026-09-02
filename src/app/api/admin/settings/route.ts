import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePlatformSettingSchema } from "@/lib/validations/admin";
import { PLATFORM_SETTING_KEYS, getSetting } from "@/lib/settings";

// ─── GET: List Platform Settings ──────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const settings = await Promise.all(
      PLATFORM_SETTING_KEYS.map(async (key) => ({ key, value: await getSetting(key) }))
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update a Platform Setting ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = updatePlatformSettingSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { key, value } = result.data;

    const updated = await prisma.platformSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ key: updated.key, value: updated.value === "true" });
  } catch (error) {
    console.error("Error updating platform setting:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
