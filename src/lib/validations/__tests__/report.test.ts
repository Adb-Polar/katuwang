import { describe, it, expect } from "vitest";
import { createReportSchema, reviewReportSchema } from "@/lib/validations/report";

describe("createReportSchema", () => {
  const base = { targetType: "TUTOR" as const, targetId: "u1" };

  it("accepts a checklist-only report", () => {
    const parsed = createReportSchema.safeParse({ ...base, violations: ["NO_SHOW_OR_ABSENCE"] });
    expect(parsed.success).toBe(true);
  });

  it("rejects a report with no violations", () => {
    const parsed = createReportSchema.safeParse({ ...base, violations: [] });
    expect(parsed.success).toBe(false);
  });

  it("requires a 10+ char description when OTHER is chosen", () => {
    expect(
      createReportSchema.safeParse({ ...base, violations: ["OTHER"], details: "bad" }).success
    ).toBe(false);
    expect(
      createReportSchema.safeParse({
        ...base,
        violations: ["OTHER"],
        details: "He kept asking for my phone number.",
      }).success
    ).toBe(true);
  });

  it("rejects an unknown violation value", () => {
    const parsed = createReportSchema.safeParse({ ...base, violations: ["NOT_A_REASON"] });
    expect(parsed.success).toBe(false);
  });
});

describe("reviewReportSchema", () => {
  it("accepts RESOLVE and DISMISS", () => {
    expect(reviewReportSchema.safeParse({ decision: "RESOLVE" }).success).toBe(true);
    expect(reviewReportSchema.safeParse({ decision: "DISMISS", resolutionNote: "" }).success).toBe(true);
  });

  it("rejects anything else", () => {
    expect(reviewReportSchema.safeParse({ decision: "APPROVE" }).success).toBe(false);
  });
});
