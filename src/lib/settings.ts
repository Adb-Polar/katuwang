import { prisma } from "@/lib/prisma";

export const PLATFORM_SETTING_KEYS = ["requireCertificationForClassCreation", "registrationOpen"] as const;

export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

const DEFAULTS: Record<PlatformSettingKey, boolean> = {
  requireCertificationForClassCreation: false,
  registrationOpen: true,
};

export async function getSetting(key: PlatformSettingKey): Promise<boolean> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  if (!row) return DEFAULTS[key];
  return row.value === "true";
}
