import { describe, expect, it } from "vitest";
import { nextSessionAt } from "../classStatus";

const now = new Date("2026-11-17T07:00:00Z");

describe("nextSessionAt", () => {
  it("picks the soonest upcoming scheduled session, skipping past and cancelled ones", () => {
    expect(nextSessionAt([
      { scheduledAt: "2026-11-10T08:00:00Z", status: "COMPLETED" },
      { scheduledAt: "2026-11-18T08:00:00Z", status: "CANCELLED" },
      { scheduledAt: "2026-11-25T08:00:00Z", status: "SCHEDULED" },
      { scheduledAt: "2026-11-20T08:00:00Z", status: "SCHEDULED" },
    ], now)).toBe("2026-11-20T08:00:00.000Z");
  });

  it("falls back to the most recent session when nothing is upcoming, and null with no sessions", () => {
    expect(nextSessionAt([
      { scheduledAt: "2026-11-01T08:00:00Z", status: "COMPLETED" },
      { scheduledAt: "2026-11-08T08:00:00Z", status: "COMPLETED" },
    ], now)).toBe("2026-11-08T08:00:00.000Z");
    expect(nextSessionAt([], now)).toBeNull();
  });
});
