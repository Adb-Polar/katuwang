import { describe, it, expect, vi } from "vitest";
import { pickQuestionIds } from "@/lib/assessmentPicker";

function makeTx(poolIds: string[], seenIds: string[] | null) {
  const findMany = vi.fn().mockResolvedValue(poolIds.map((id) => ({ id })));
  return {
    assessmentQuestion: { findMany },
    assessmentAttempt: {
      findFirst: vi
        .fn()
        .mockResolvedValue(seenIds ? { items: seenIds.map((id) => ({ questionId: id })) } : null),
    },
  } as never;
}

const args = { tutorProfileId: "tp1", subject: "MATH" as const, topic: "Algebraic Expressions", count: 5 };

describe("pickQuestionIds", () => {
  it("returns exactly `count` ids when the pool is larger", async () => {
    const tx = makeTx(["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"], null);
    const ids = await pickQuestionIds(tx, args);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  it("prefers questions not seen in the last attempt", async () => {
    const pool = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];
    const tx = makeTx(pool, ["q1", "q2", "q3", "q4", "q5"]);
    const ids = await pickQuestionIds(tx, args);
    expect(ids).toHaveLength(5);
    // All five should come from the unseen half.
    expect(ids.every((id) => ["q6", "q7", "q8", "q9", "q10"].includes(id))).toBe(true);
  });

  it("tops up with seen questions when the fresh pool is too small", async () => {
    const tx = makeTx(["q1", "q2", "q3", "q4", "q5", "q6"], ["q1", "q2", "q3", "q4", "q5"]);
    const ids = await pickQuestionIds(tx, args);
    expect(ids).toHaveLength(5);
    expect(ids).toContain("q6"); // the only fresh one must be included
  });

  it("returns the whole pool (shuffled) when it is not larger than `count`", async () => {
    const tx = makeTx(["q1", "q2", "q3"], null);
    const ids = await pickQuestionIds(tx, args);
    expect([...ids].sort()).toEqual(["q1", "q2", "q3"]);
  });

  it("only ever draws from the BANK pool (never tutor-authored questions)", async () => {
    const tx = makeTx(["q1", "q2", "q3"], null);
    await pickQuestionIds(tx, args);
    expect(
      (tx as unknown as { assessmentQuestion: { findMany: ReturnType<typeof vi.fn> } })
        .assessmentQuestion.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ origin: "BANK" }) }),
    );
  });
});
