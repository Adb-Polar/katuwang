import { beforeEach, describe, expect, it, vi } from "vitest";
const lookup = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { sessionTestAttempt: { findFirst: lookup } } }));
import { canRevealLearnerSessionAnswers } from "@/lib/sessionTestFeedback";
const pre = { learnerId: "learner1", sessionTestId: "test1", kind: "PRE" as const, status: "SUBMITTED" as const };
beforeEach(() => { lookup.mockReset();lookup.mockResolvedValue(null); });
describe("learner session answer feedback", () => {
  it("never reveals an in-progress attempt, including POST", async () => {
    expect(await canRevealLearnerSessionAnswers({ ...pre, kind: "POST", status: "IN_PROGRESS" })).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });
  it("withholds PRE feedback without a submitted matching POST", async () => {
    expect(await canRevealLearnerSessionAnswers(pre)).toBe(false);
    expect(lookup).toHaveBeenCalledWith({ where: { learnerId: "learner1", sessionTestId: "test1", kind: "POST", status: "SUBMITTED" }, select: { id: true } });
  });
  it("reveals PRE feedback after the same learner/test POST submission", async () => {
    lookup.mockResolvedValue({ id: "post1" });
    expect(await canRevealLearnerSessionAnswers(pre)).toBe(true);
  });
  it("reveals submitted POST feedback", async () => {
    expect(await canRevealLearnerSessionAnswers({ ...pre, kind: "POST" })).toBe(true);
    expect(lookup).not.toHaveBeenCalled();
  });
});
