import { prisma } from "@/lib/prisma";
import { ASSESSMENT_DEFAULTS, type ResolvedTopicConfig } from "@/lib/assessmentConfig";

export const PLATFORM_SETTING_KEYS = [
  "requireCertificationForClassCreation",
  "registrationOpen",
  "matchingEnabled",
  "showTutorRealNames",
  "requireRegistrationApproval",
  "autoCertifyOnAssessmentPass",
] as const;

export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

const DEFAULTS: Record<PlatformSettingKey, boolean> = {
  requireCertificationForClassCreation: false,
  registrationOpen: true,
  matchingEnabled: true,
  showTutorRealNames: false,
  requireRegistrationApproval: false,
  autoCertifyOnAssessmentPass: false,
};

export async function getSetting(key: PlatformSettingKey): Promise<boolean> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  if (!row) return DEFAULTS[key];
  return row.value === "true";
}

// ─── Global assessment tuning ──────────────────────────────────────────────
// One platform-wide value per field, applied to every subject and topic.
// Stored as string-valued `PlatformSetting` rows (same table as the flags).

export const ASSESSMENT_SETTING_KEYS = {
  questionCount: "assessmentQuestionCount",
  passPercent: "assessmentPassPercent",
  minBankSize: "assessmentMinBankSize",
} as const;

/** Resolve the live global assessment config, falling back to ASSESSMENT_DEFAULTS. */
export async function getAssessmentConfig(): Promise<ResolvedTopicConfig> {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: Object.values(ASSESSMENT_SETTING_KEYS) } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const read = (key: string, fallback: number) => {
    const n = Number.parseInt(byKey.get(key) ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    questionCount: read(ASSESSMENT_SETTING_KEYS.questionCount, ASSESSMENT_DEFAULTS.questionCount),
    passPercent: read(ASSESSMENT_SETTING_KEYS.passPercent, ASSESSMENT_DEFAULTS.passPercent),
    minBankSize: read(ASSESSMENT_SETTING_KEYS.minBankSize, ASSESSMENT_DEFAULTS.minBankSize),
  };
}
