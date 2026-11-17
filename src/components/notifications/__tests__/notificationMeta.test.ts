import { describe, expect, it } from "vitest";
import { notificationWhen } from "../notificationMeta";

// 2026-11-17 10:00 in Manila.
const now = new Date("2026-11-17T02:00:00Z");

describe("notificationWhen", () => {
  it("shows only the time for today (Philippine time)", () => {
    expect(notificationWhen("2026-11-16T23:30:00Z", now)).toBe("07:30 AM"); // Nov 17, 07:30 in Manila
  });

  it("puts Yesterday or the weekday and date before the time for older ones", () => {
    expect(notificationWhen("2026-11-16T06:40:00Z", now)).toBe("Yesterday · 02:40 PM");
    expect(notificationWhen("2026-11-14T00:40:00Z", now)).toBe("Sat, Nov 14 · 08:40 AM");
  });
});
