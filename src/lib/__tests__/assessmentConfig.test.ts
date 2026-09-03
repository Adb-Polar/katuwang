import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { platformSetting: { findMany: (...a: unknown[]) => findMany(...a) } },
}));

import { ASSESSMENT_DEFAULTS } from "@/lib/assessmentConfig";
import { getAssessmentConfig } from "@/lib/settings";

describe("getAssessmentConfig", () => {
  beforeEach(() => findMany.mockReset());

  it("returns the global defaults when no rows exist", async () => {
    findMany.mockResolvedValue([]);
    await expect(getAssessmentConfig()).resolves.toEqual(ASSESSMENT_DEFAULTS);
  });

  it("uses stored values when present", async () => {
    findMany.mockResolvedValue([
      { key: "assessmentQuestionCount", value: "8" },
      { key: "assessmentPassPercent", value: "60" },
      { key: "assessmentMinBankSize", value: "12" },
    ]);
    await expect(getAssessmentConfig()).resolves.toEqual({
      questionCount: 8,
      passPercent: 60,
      minBankSize: 12,
    });
  });

  it("falls back to a default for an unparseable or non-positive value", async () => {
    findMany.mockResolvedValue([
      { key: "assessmentQuestionCount", value: "not-a-number" },
      { key: "assessmentPassPercent", value: "0" },
      { key: "assessmentMinBankSize", value: "7" },
    ]);
    await expect(getAssessmentConfig()).resolves.toEqual({
      questionCount: ASSESSMENT_DEFAULTS.questionCount,
      passPercent: ASSESSMENT_DEFAULTS.passPercent,
      minBankSize: 7,
    });
  });
});
