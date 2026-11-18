import { describe, expect, it } from "vitest";
import { slotLabel } from "@/components/requests/requestSlots";

describe("slotLabel", () => {
  it("formats a dated slot with a weekday, date and 12-hour range", () => {
    expect(slotLabel({ date: "2026-12-11", day: "FRIDAY", startTime: "15:00", endTime: "16:00" })).toBe("Fri, Dec 11 · 3:00–4:00 PM");
  });

  it("formats a weekly slot and keeps both meridiems when the range crosses noon", () => {
    expect(slotLabel({ day: "SATURDAY", startTime: "11:30", endTime: "13:00" })).toBe("Every Saturday · 11:30 AM–1:00 PM");
  });
});
