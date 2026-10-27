import { describe, expect, it } from "vitest";
import { combineDateAndTime, formatDateTime, formatWeekday, parseLocalDateAndTime } from "../datetime";

describe("school time zone", () => {
  it("round trips a Manila schedule through UTC", () => {
    const stored = combineDateAndTime("2026-10-29", "15:00");
    expect(stored).toBe("2026-10-29T07:00:00.000Z");
    expect(parseLocalDateAndTime(stored)).toEqual({ date: "2026-10-29", time: "15:00" });
    expect(formatDateTime(stored!)).toMatch(/3:00\s?PM/);
  });

  it("groups the school day across a UTC date boundary", () => {
    expect(formatWeekday("2026-10-25T17:00:00.000Z")).toBe("Mon");
    expect(parseLocalDateAndTime("2026-10-25T17:00:00.000Z"))
      .toEqual({ date: "2026-10-26", time: "01:00" });
  });

  it("rejects invalid calendar input", () => {
    expect(combineDateAndTime("2026-02-30", "08:00")).toBeNull();
    expect(combineDateAndTime("2026-10-29", "25:00")).toBeNull();
  });
});
