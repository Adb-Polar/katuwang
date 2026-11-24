import { describe, it, expect } from "vitest";
import { SUBMIT_GRACE_MS, attemptDeadline, isSubmitTooLate } from "@/lib/attemptDeadline";

const STARTED = new Date("2026-12-01T09:00:00.000Z");

describe("attemptDeadline", () => {
  it("adds the limit to the start time", () => {
    expect(attemptDeadline(STARTED, 15)).toEqual(new Date("2026-12-01T09:15:00.000Z"));
  });

  it.each([null, undefined, 0, -5])("is null (untimed) for a limit of %s", (limit) => {
    expect(attemptDeadline(STARTED, limit)).toBeNull();
  });
});

describe("isSubmitTooLate", () => {
  const deadline = new Date("2026-12-01T09:15:00.000Z");

  it("is never too late for an untimed attempt", () => {
    expect(isSubmitTooLate(null, new Date("2030-01-01T00:00:00.000Z"))).toBe(false);
  });

  it("accepts a submit before the deadline", () => {
    expect(isSubmitTooLate(deadline, new Date("2026-12-01T09:14:59.000Z"))).toBe(false);
  });

  it("accepts a submit exactly at the end of the grace window", () => {
    expect(isSubmitTooLate(deadline, new Date(deadline.getTime() + SUBMIT_GRACE_MS))).toBe(false);
  });

  it("rejects a submit just past the grace window", () => {
    expect(isSubmitTooLate(deadline, new Date(deadline.getTime() + SUBMIT_GRACE_MS + 1))).toBe(true);
  });
});
