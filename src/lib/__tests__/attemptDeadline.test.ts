import { describe, expect, it } from "vitest";
import { attemptDeadline, formatCountdown, wasSubmittedLate } from "@/lib/attemptDeadline";

const startedAt = new Date("2026-12-01T01:00:00.000Z");
const after = (ms: number) => new Date(startedAt.getTime() + ms);
const TEN_MINUTES = 10 * 60_000;

describe("attemptDeadline", () => {
  it("is the start time plus the limit", () => {
    expect(attemptDeadline({ startedAt, timeLimitMinutes: 10 })).toEqual(after(TEN_MINUTES));
  });

  it("is null for an untimed attempt", () => {
    expect(attemptDeadline({ startedAt, timeLimitMinutes: null })).toBeNull();
  });
});

describe("wasSubmittedLate", () => {
  const timed = { startedAt, timeLimitMinutes: 10 };

  it("is false for a submit before the deadline", () => {
    expect(wasSubmittedLate({ ...timed, submittedAt: after(TEN_MINUTES - 1) })).toBe(false);
  });

  it("is false inside the 30-second grace period", () => {
    expect(wasSubmittedLate({ ...timed, submittedAt: after(TEN_MINUTES + 30_000) })).toBe(false);
  });

  it("is true just after the grace period", () => {
    expect(wasSubmittedLate({ ...timed, submittedAt: after(TEN_MINUTES + 30_001) })).toBe(true);
  });

  it("is false while the attempt is still in progress", () => {
    expect(wasSubmittedLate({ ...timed, submittedAt: null })).toBe(false);
  });

  it("is never true for an untimed attempt", () => {
    expect(wasSubmittedLate({ startedAt, timeLimitMinutes: null, submittedAt: after(24 * 60 * 60_000) })).toBe(false);
  });
});

describe("formatCountdown", () => {
  it.each([
    [245_000, "4:05"],
    [60_000, "1:00"],
    [59_001, "1:00"],
    [1, "0:01"],
    [0, "0:00"],
    [-5_000, "0:00"],
    [3_725_000, "1:02:05"],
  ])("formats %i ms as %s", (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });
});
