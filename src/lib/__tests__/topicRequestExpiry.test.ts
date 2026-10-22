import { describe, expect, it } from "vitest";
import { activeOpenWhere, expiredOpenWhere, requestDeadline } from "@/lib/topicRequestHistory";

describe("topic request deadline", () => {
  const submitted = new Date("2026-10-19T00:00:00.000Z");
  const deadline = new Date("2026-10-22T00:00:00.000Z");
  it("starts a 72 hour window", () => {
    expect(requestDeadline(submitted)).toEqual(deadline);
  });
  it("uses strict active and inclusive expired boundaries", () => {
    expect(activeOpenWhere(deadline)).toEqual({ status: "OPEN", expiresAt: { gt: deadline } });
    expect(expiredOpenWhere(deadline)).toEqual({ status: "OPEN", expiresAt: { lte: deadline } });
  });
});
