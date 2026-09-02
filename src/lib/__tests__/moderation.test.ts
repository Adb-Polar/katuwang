import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { tutorClass: { updateMany: vi.fn() } },
}));

import { computeExpiresAt } from "@/lib/moderation";

describe("computeExpiresAt", () => {
  it("returns null when no duration is given", () => {
    expect(computeExpiresAt(undefined)).toBeNull();
  });

  it("returns null when duration is zero", () => {
    expect(computeExpiresAt(0)).toBeNull();
  });

  it("computes a date offset by the given number of days", () => {
    const before = Date.now();
    const result = computeExpiresAt(5);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBeGreaterThanOrEqual(before + 5 * 24 * 60 * 60 * 1000 - 1000);
    expect(result!.getTime()).toBeLessThanOrEqual(before + 5 * 24 * 60 * 60 * 1000 + 5000);
  });
});
