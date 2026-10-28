import { isAdminRole } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import {
  updatePlatformSettingSchema,
  updateProfilePictureRequirementSchema,
} from "@/lib/validations/admin";
import {
  PLATFORM_SETTING_KEYS,
  PROFILE_PICTURE_REQUIREMENT_KEY,
  getSetting,
  getProfilePictureRequirement,
} from "@/lib/settings";

// ─── GET: List Platform Settings ──────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getActiveServerSession();

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const settings: { key: string; value: boolean | string }[] = await Promise.all(
      PLATFORM_SETTING_KEYS.map(async (key) => ({ key, value: await getSetting(key) }))
    );

    settings.push({
      key: PROFILE_PICTURE_REQUIREMENT_KEY,
      value: await getProfilePictureRequirement(),
    });

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
    const session = await getActiveServerSession();

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();

    if (body?.key === PROFILE_PICTURE_REQUIREMENT_KEY) {
      const result = updateProfilePictureRequirementSchema.safeParse(body);
      if (!result.success) {
        const errorMsg = result.error.issues[0]?.message || "Invalid requirement option.";
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      const updated = await prisma.platformSetting.upsert({
        where: { key: PROFILE_PICTURE_REQUIREMENT_KEY },
        update: { value: result.data.value },
        create: { key: PROFILE_PICTURE_REQUIREMENT_KEY, value: result.data.value },
      });

      return NextResponse.json({ key: updated.key, value: updated.value });
    }

    const result = updatePlatformSettingSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
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
