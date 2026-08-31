import { describe, it, expect } from "vitest";
import { deriveWeeklyAvailability, SessionForDerivation } from "@/lib/derivedAvailability";

const NOW = new Date("2026-03-02T08:00:00"); // a Monday, local time

function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function session(overrides: Partial<SessionForDerivation> = {}): SessionForDerivation {
  return { scheduledAt: at(1, 15), duration: 60, status: "SCHEDULED", ...overrides };
}

describe("deriveWeeklyAvailability", () => {
  it("returns an empty list when there are no sessions", () => {
    expect(deriveWeeklyAvailability([], NOW)).toEqual([]);
  });

  it("turns one upcoming session into one weekday window (start + duration)", () => {
    const slots = deriveWeeklyAvailability([session({ scheduledAt: at(2, 15), duration: 90 })], NOW);
    expect(slots).toEqual([{ day: "WEDNESDAY", startTime: "15:00", endTime: "16:30" }]);
  });

  it("ignores past, cancelled, and completed sessions", () => {
    const slots = deriveWeeklyAvailability(
      [
        session({ scheduledAt: at(-1, 15) }), // past
        session({ scheduledAt: at(3, 10), status: "CANCELLED" }),
        session({ scheduledAt: at(3, 12), status: "COMPLETED" }),
      ],
      NOW
    );
    expect(slots).toEqual([]);
  });

  it("merges overlapping and back-to-back sessions on the same weekday", () => {
    const slots = deriveWeeklyAvailability(
      [
        session({ scheduledAt: at(1, 15), duration: 60 }), // 15:00-16:00
        session({ scheduledAt: at(1, 16), duration: 60 }), // 16:00-17:00 (adjacent)
        session({ scheduledAt: at(1, 16, 30), duration: 60 }), // 16:30-17:30 (overlaps)
      ],
      NOW
    );
    expect(slots).toEqual([{ day: "TUESDAY", startTime: "15:00", endTime: "17:30" }]);
  });

  it("keeps a gap on the same weekday as two separate windows", () => {
    const slots = deriveWeeklyAvailability(
      [
        session({ scheduledAt: at(1, 9), duration: 60 }), // 09:00-10:00
        session({ scheduledAt: at(1, 14), duration: 60 }), // 14:00-15:00
      ],
      NOW
    );
    expect(slots).toEqual([
      { day: "TUESDAY", startTime: "09:00", endTime: "10:00" },
      { day: "TUESDAY", startTime: "14:00", endTime: "15:00" },
    ]);
  });

  it("orders windows Monday-first across weekdays", () => {
    const slots = deriveWeeklyAvailability(
      [
        session({ scheduledAt: at(5, 10) }), // Saturday
        session({ scheduledAt: at(1, 10) }), // Tuesday
        session({ scheduledAt: at(3, 10) }), // Thursday
      ],
      NOW
    );
    expect(slots.map((s) => s.day)).toEqual(["TUESDAY", "THURSDAY", "SATURDAY"]);
  });

  it("caps an over-running window at end of day", () => {
    const slots = deriveWeeklyAvailability(
      [session({ scheduledAt: at(1, 23, 30), duration: 120 })], // 23:30 + 2h
      NOW
    );
    expect(slots).toEqual([{ day: "TUESDAY", startTime: "23:30", endTime: "24:00" }]);
  });
});
