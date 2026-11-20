import { describe, it, expect } from "vitest";
import { resolveReportRange, MAX_RANGE_DAYS } from "@/lib/reports/range";

// 2026-11-19 07:00 PHT
const now = new Date("2026-11-18T23:00:00Z");

describe("resolveReportRange", () => {
  it("defaults to the 90 days ending today in Philippine time", () => {
    const r = resolveReportRange(undefined, undefined, now);
    if ("error" in r) throw new Error(r.error);
    expect(r.to).toBe("2026-11-19");
    expect(r.from).toBe("2026-08-22");
  });

  it("uses PH midnight bounds with an exclusive end", () => {
    const r = resolveReportRange("2026-11-01", "2026-11-01");
    if ("error" in r) throw new Error(r.error);
    expect(r.start.toISOString()).toBe("2026-10-31T16:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-11-01T16:00:00.000Z");
  });

  it("rejects from after to", () => {
    expect(resolveReportRange("2026-11-02", "2026-11-01")).toEqual({ error: expect.stringMatching(/on or before/) });
  });

  it("accepts exactly the maximum span and rejects one day more", () => {
    expect("error" in resolveReportRange("2025-01-01", "2026-01-01")).toBe(false); // 366 days
    expect(MAX_RANGE_DAYS).toBe(366);
    expect(resolveReportRange("2025-01-01", "2026-01-02")).toEqual({ error: expect.stringMatching(/at most/) });
  });

  it("rejects impossible calendar dates", () => {
    expect(resolveReportRange("2026-02-30", "2026-03-01")).toEqual({ error: "Invalid start date." });
  });
});
