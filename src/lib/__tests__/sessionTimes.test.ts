import { describe, expect, it } from "vitest";
import {
  addMinutesToTime,
  formatSessionLength,
  scheduleProblem,
  sessionLengthError,
  sessionMinutes,
  todayInSchoolZone,
  type BusySession,
} from "@/lib/sessionTimes";

describe("addMinutesToTime", () => {
  it("adds minutes within the day", () => {
    expect(addMinutesToTime("14:30", 90)).toBe("16:00");
  });

  it("wraps past midnight", () => {
    expect(addMinutesToTime("23:30", 60)).toBe("00:30");
  });

  it("returns an empty string when there is no start time", () => {
    expect(addMinutesToTime("", 60)).toBe("");
  });
});

describe("sessionMinutes", () => {
  it("measures a same-day session", () => {
    expect(sessionMinutes("09:00", "10:30")).toBe(90);
  });

  it("reads an end before the start as the next day", () => {
    expect(sessionMinutes("23:00", "00:30")).toBe(90);
  });

  it("returns null for an incomplete pair", () => {
    expect(sessionMinutes("09:00", "")).toBeNull();
  });
});

describe("sessionLengthError", () => {
  it("accepts the shortest and longest allowed sessions", () => {
    expect(sessionLengthError("09:00", "09:15")).toBe("");
    expect(sessionLengthError("09:00", "13:00")).toBe("");
  });

  it("rejects a session shorter than 15 minutes", () => {
    expect(sessionLengthError("09:00", "09:14")).toBe("A session must be at least 15 minutes long.");
  });

  it("rejects a session longer than 4 hours", () => {
    expect(sessionLengthError("09:00", "13:01")).toBe("A session cannot be longer than 4 hours.");
  });

  it("explains an end time that is before or equal to the start", () => {
    expect(sessionLengthError("15:00", "14:00")).toBe("End time must be after the start time.");
    expect(sessionLengthError("15:00", "15:00")).toBe("End time must be after the start time.");
  });

  it("allows a short session that crosses midnight", () => {
    expect(sessionLengthError("23:00", "00:30")).toBe("");
  });
});

describe("formatSessionLength", () => {
  it.each([
    [30, "30 min"],
    [60, "1 hr"],
    [90, "1 hr 30 min"],
    [240, "4 hr"],
  ])("formats %i minutes as %s", (minutes, text) => {
    expect(formatSessionLength(minutes)).toBe(text);
  });
});

describe("todayInSchoolZone", () => {
  it("uses the Philippine date even when UTC is still on the previous day", () => {
    expect(todayInSchoolZone(new Date("2026-11-30T17:30:00.000Z"))).toBe("2026-12-01");
  });
});

describe("scheduleProblem", () => {
  const now = new Date("2026-12-01T00:00:00.000Z"); // 8:00 AM PHT
  // 3:00 PM–4:30 PM PHT on 2 Dec 2026
  const busy: BusySession[] = [
    { id: "s1", scheduledAt: "2026-12-02T07:00:00.000Z", duration: 90, label: "Chemistry 3 · C-0002" },
  ];

  it("flags a time that has already passed", () => {
    expect(scheduleProblem({ date: "2026-12-01", time: "07:59", duration: 60 }, busy, now)).toBe(
      "This date and time has already passed."
    );
  });

  it("names the session it overlaps and when that session runs", () => {
    const problem = scheduleProblem({ date: "2026-12-02", time: "16:00", duration: 60 }, busy, now);
    expect(problem).toContain("Chemistry 3 · C-0002");
    expect(problem).toMatch(/3:00\s?PM/i);
    expect(problem).toMatch(/4:30\s?PM/i);
  });

  it("allows a session that starts exactly when another ends", () => {
    expect(scheduleProblem({ date: "2026-12-02", time: "16:30", duration: 60 }, busy, now)).toBe("");
  });

  it("allows the same time on a different day", () => {
    expect(scheduleProblem({ date: "2026-12-03", time: "15:00", duration: 60 }, busy, now)).toBe("");
  });

  it("stays quiet until both the date and the time are filled in", () => {
    expect(scheduleProblem({ date: "2026-12-02", time: "", duration: 60 }, busy, now)).toBe("");
    expect(scheduleProblem({ date: "", time: "15:00", duration: 60 }, busy, now)).toBe("");
  });
});
