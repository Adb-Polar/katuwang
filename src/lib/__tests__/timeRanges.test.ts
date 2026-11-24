import { describe, it, expect } from "vitest";
import { findOverlap, hasPairwiseOverlap, rangesOverlap } from "@/lib/timeRanges";

const at = (hhmm: string, duration: number) => ({
  scheduledAt: new Date(`2026-12-01T${hhmm}:00.000Z`),
  duration,
});

describe("rangesOverlap", () => {
  it("is true when one range starts inside the other", () => {
    expect(rangesOverlap(at("09:00", 60), at("09:30", 60))).toBe(true);
  });

  it("is false for back-to-back ranges", () => {
    expect(rangesOverlap(at("09:00", 60), at("10:00", 60))).toBe(false);
  });

  it("accepts ISO strings as well as Dates", () => {
    expect(rangesOverlap({ scheduledAt: "2026-12-01T09:00:00.000Z", duration: 60 }, at("09:59", 15))).toBe(true);
  });
});

describe("findOverlap", () => {
  it("returns the overlapping range", () => {
    const busy = [at("08:00", 60), at("10:00", 60)];
    expect(findOverlap(at("10:30", 30), busy)).toBe(busy[1]);
  });

  it("returns undefined when nothing overlaps", () => {
    expect(findOverlap(at("09:00", 60), [at("08:00", 60), at("10:00", 60)])).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(findOverlap(at("09:00", 60), [])).toBeUndefined();
  });
});

describe("hasPairwiseOverlap", () => {
  it("detects an overlap between non-adjacent entries", () => {
    expect(hasPairwiseOverlap([at("09:00", 60), at("11:00", 60), at("09:30", 30)])).toBe(true);
  });

  it("is false for a single range", () => {
    expect(hasPairwiseOverlap([at("09:00", 60)])).toBe(false);
  });
});
