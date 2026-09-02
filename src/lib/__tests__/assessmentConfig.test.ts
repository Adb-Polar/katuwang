import { describe, it, expect } from "vitest";
import { ASSESSMENT_DEFAULTS, resolveTopicConfig } from "@/lib/assessmentConfig";

describe("resolveTopicConfig", () => {
  it("returns the global defaults when the row is null", () => {
    expect(resolveTopicConfig(null)).toEqual(ASSESSMENT_DEFAULTS);
  });

  it("uses the row's values when present", () => {
    expect(
      resolveTopicConfig({ questionCount: 8, passPercent: 60, minBankSize: 12 })
    ).toEqual({ questionCount: 8, passPercent: 60, minBankSize: 12 });
  });
});
