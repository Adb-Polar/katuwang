import { describe, expect, it } from "vitest";
import { attemptWindowError, ATTEMPT_CLOSE_GRACE_MS } from "@/lib/sessionTestWindow";

const closed = new Date("2026-11-06T10:00:00Z");
const attempt = { kind: "PRE" as const, status: "IN_PROGRESS" as const, startedAt: new Date(closed.getTime() - 60_000) };
const test = { status: "CLOSED" as const, closedAt: closed, pretestClosedAt: null };
describe("existing attempt closure policy", () => {
  it("allows an existing attempt through the grace deadline", () => {
    expect(attemptWindowError(attempt, test, "SCHEDULED", new Date(closed.getTime() + ATTEMPT_CLOSE_GRACE_MS))).toBeNull();
  });
  it("rejects immediately after the grace deadline", () => {
    expect(attemptWindowError(attempt, test, "SCHEDULED", new Date(closed.getTime() + ATTEMPT_CLOSE_GRACE_MS + 1))).toMatch(/15-minute/);
  });
  it("does not grant grace to an attempt started after closure", () => {
    expect(attemptWindowError({ ...attempt, startedAt: new Date(closed.getTime() + 1) }, test, "SCHEDULED", closed)).not.toBeNull();
  });
  it("cannot extend an earlier PRE closure by closing all testing later", () => {
    expect(attemptWindowError(attempt, { ...test, closedAt: new Date(closed.getTime() + 20 * 60_000), pretestClosedAt: closed }, "COMPLETED", new Date(closed.getTime() + 21 * 60_000))).not.toBeNull();
  });
  it("blocks cancelled sessions even during grace", () => {
    expect(attemptWindowError(attempt, test, "CANCELLED", closed)).toMatch(/cancelled/);
  });
  it("fails closed for legacy closure without a timestamp", () => {
    expect(attemptWindowError(attempt, { ...test, closedAt: null }, "SCHEDULED", closed)).not.toBeNull();
    expect(attemptWindowError(attempt, { ...test, status: "PUBLISHED", closedAt: null }, "COMPLETED", closed)).not.toBeNull();
  });
  it("allows submitted results after ordinary closure", () => {
    expect(attemptWindowError({ ...attempt, status: "SUBMITTED" }, test, "COMPLETED", new Date(closed.getTime() + 60 * 60_000))).toBeNull();
  });
});
