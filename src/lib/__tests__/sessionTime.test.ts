import { describe, it, expect } from "vitest";
import {
  busySlotsOn,
  formatDuration,
  resolveSessionTime,
  sessionTimeError,
  sessionTimeFromRange,
  type BusySlot,
} from "@/lib/sessionTime";

const NOW = new Date("2026-12-01T08:00:00");
const value = (startTime: string, endTime: string, date = "2026-12-02") => ({ date, startTime, endTime });
const busySlot: BusySlot = {
  id: "s1",
  classCode: "C-0012",
  topic: "Algebra",
  scheduledAt: new Date("2026-12-02T09:00:00"),
  duration: 60,
};

describe("resolveSessionTime", () => {
  it("derives the duration from the start and end times", () => {
    const resolved = resolveSessionTime(value("09:00", "10:30"));
    expect(resolved?.duration).toBe(90);
    expect(resolved?.scheduledAt).toEqual(new Date("2026-12-02T09:00:00"));
  });

  it("returns null while a field is blank", () => {
    expect(resolveSessionTime(value("09:00", ""))).toBeNull();
    expect(resolveSessionTime({ date: "", startTime: "09:00", endTime: "10:00" })).toBeNull();
  });
});

describe("sessionTimeFromRange", () => {
  it("round-trips through resolveSessionTime", () => {
    const start = new Date("2026-12-02T13:15:00");
    const resolved = resolveSessionTime(sessionTimeFromRange(start, 45));
    expect(resolved).toEqual({ scheduledAt: start, duration: 45 });
  });
});

describe("formatDuration", () => {
  it.each([
    [45, "45m"],
    [60, "1h"],
    [90, "1h 30m"],
    [240, "4h"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("sessionTimeError", () => {
  it("is null for a valid future slot", () => {
    expect(sessionTimeError(value("11:00", "12:00"), { now: NOW, busy: [busySlot] })).toBeNull();
  });

  it("is null while the value is incomplete", () => {
    expect(sessionTimeError(value("11:00", ""), { now: NOW })).toBeNull();
  });

  it("rejects an end time that is not after the start", () => {
    expect(sessionTimeError(value("11:00", "11:00"), { now: NOW })).toMatch(/after the start/);
    expect(sessionTimeError(value("11:00", "10:00"), { now: NOW })).toMatch(/after the start/);
  });

  it("rejects sessions shorter than 15 minutes", () => {
    expect(sessionTimeError(value("11:00", "11:10"), { now: NOW })).toMatch(/at least 15 minutes/);
  });

  it("accepts the 15-minute and 4-hour boundaries", () => {
    expect(sessionTimeError(value("11:00", "11:15"), { now: NOW })).toBeNull();
    expect(sessionTimeError(value("11:00", "15:00"), { now: NOW })).toBeNull();
  });

  it("rejects sessions longer than 4 hours", () => {
    expect(sessionTimeError(value("11:00", "15:01"), { now: NOW })).toMatch(/longer than 4h/);
  });

  it("rejects a start in the past", () => {
    expect(sessionTimeError(value("07:00", "08:00", "2026-12-01"), { now: NOW })).toMatch(/in the past/);
  });

  it("names the class that is already booked", () => {
    expect(sessionTimeError(value("09:30", "10:30"), { now: NOW, busy: [busySlot] })).toMatch(/C-0012 \(Algebra\)/);
  });

  it("allows a slot that starts exactly when a booked one ends", () => {
    expect(sessionTimeError(value("10:00", "11:00"), { now: NOW, busy: [busySlot] })).toBeNull();
  });

  it("flags an overlap with another row in the same form", () => {
    const siblings = [{ scheduledAt: new Date("2026-12-02T13:00:00"), duration: 60 }];
    expect(sessionTimeError(value("13:30", "14:00"), { now: NOW, siblings })).toMatch(/another session in this form/);
  });
});

describe("busySlotsOn", () => {
  it("keeps only the slots on the given local date", () => {
    expect(busySlotsOn("2026-12-02", [busySlot])).toEqual([busySlot]);
    expect(busySlotsOn("2026-12-03", [busySlot])).toEqual([]);
  });
});
