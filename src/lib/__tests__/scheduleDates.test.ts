import { describe, expect, it } from "vitest";
import { scheduleDate, timetableDays } from "../scheduleDates";
import { preferredSlotSchema } from "../validations/match";
describe("dated schedules", () => {
  it("uses Philippine dates across a UTC day boundary", () => {
    expect(scheduleDate("2026-10-27T17:00:00Z")).toBe("2026-10-28");
  });
  it("shows seven consecutive dates over month and year boundaries", () => {
    const days = timetableDays(new Date("2026-12-29T17:00:00Z"));
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe("2026-12-30");
    expect(days[6].date).toBe("2027-01-05");
  });
  it("preserves a dated preference and rejects an inconsistent weekday", () => {
    const slot = { date: "2026-10-28", day: "WEDNESDAY", startTime: "15:00", endTime: "16:00" };
    expect(preferredSlotSchema.parse(slot)).toEqual(slot);
    expect(preferredSlotSchema.safeParse({ ...slot, day: "MONDAY" }).success).toBe(false);
    expect(preferredSlotSchema.safeParse({ ...slot, date: "2026-02-30" }).success).toBe(false);
  });
  it("continues to accept undated weekly preferences", () => {
    expect(preferredSlotSchema.safeParse({ day: "MONDAY", startTime: "15:00", endTime: "16:00" }).success).toBe(true);
  });
});
