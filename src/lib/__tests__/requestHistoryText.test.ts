import { describe, expect, it } from "vitest";
import { changeLines, eventTitle, snapshotSlotLabel } from "../requestHistoryText";

describe("eventTitle", () => {
  it("names a status change by its new status", () => {
    expect(eventTitle("STATUS_CHANGED", { status: "ACCEPTED" })).toBe("Class created");
    expect(eventTitle("STATUS_CHANGED", { status: "CANCELLED" })).toBe("Cancelled");
  });

  it("names other events in plain words and falls back for unknown ones", () => {
    expect(eventTitle("CREATED", null)).toBe("Request posted");
    expect(eventTitle("RESUBMITTED", null)).toBe("Request renewed");
    expect(eventTitle("SOMETHING_NEW", null)).toBe("Request updated");
  });
});

describe("changeLines", () => {
  const before = {
    status: "OPEN",
    topics: ["Fractions"],
    slots: [{ day: "FRIDAY", startTime: "15:00", endTime: "16:00" }],
    note: null,
  };

  it("lists changed topics, times and note, one line each", () => {
    const after = {
      ...before,
      topics: ["Fractions", "Ratios"],
      slots: [{ day: "SATURDAY", startTime: "09:00", endTime: "10:30" }],
      note: "Please go slow.",
    };
    expect(changeLines(before, after)).toEqual([
      "Topics: Fractions → Fractions, Ratios",
      "Free times: Fri 3:00 PM–4:00 PM → Sat 9:00 AM–10:30 AM",
      "Note: “Please go slow.”",
    ]);
  });

  it("never shows internal IDs and says nothing when only the status moved", () => {
    const withIds = { ...before, learnerId: "cuid-learner", directedTutorProfileId: "cuid-tutor" };
    const lines = changeLines(withIds, { ...withIds, status: "ACCEPTED", fulfilledClassId: "cuid-class" });
    expect(lines).toEqual([]);
  });

  it("has nothing to compare for the first event", () => {
    expect(changeLines(null, before)).toEqual([]);
  });
});

describe("snapshotSlotLabel", () => {
  it("formats a weekday slot in 12-hour time", () => {
    expect(snapshotSlotLabel({ day: "MONDAY", startTime: "00:30", endTime: "12:00" })).toBe("Mon 12:30 AM–12:00 PM");
  });
});
