import { describe, expect, it } from "vitest";
import { rangesOverlap } from "@/lib/sessionOverlap";

const at = (time: string) => `2026-12-01T${time}:00.000Z`;

describe("rangesOverlap", () => {
  it("detects a session that starts inside another", () => {
    expect(rangesOverlap(at("09:00"), 60, at("09:30"), 60)).toBe(true);
  });

  it("detects a session fully contained in another", () => {
    expect(rangesOverlap(at("09:00"), 120, at("09:30"), 30)).toBe(true);
  });

  it("treats back-to-back sessions as free of conflict", () => {
    expect(rangesOverlap(at("09:00"), 60, at("10:00"), 60)).toBe(false);
    expect(rangesOverlap(at("10:00"), 60, at("09:00"), 60)).toBe(false);
  });

  it("flags a one-minute overlap", () => {
    expect(rangesOverlap(at("09:00"), 61, at("10:00"), 60)).toBe(true);
  });

  it("ignores sessions on different days", () => {
    expect(rangesOverlap("2026-12-01T09:00:00.000Z", 60, "2026-12-02T09:00:00.000Z", 60)).toBe(false);
  });

  it("accepts Date objects as well as ISO strings", () => {
    expect(rangesOverlap(new Date(at("09:00")), 60, new Date(at("09:59")), 15)).toBe(true);
  });
});
