import { describe, expect, it } from "vitest";
import { seededShuffle } from "@/lib/seededShuffle";

const items = Array.from({ length: 12 }, (_, i) => i);

describe("seededShuffle", () => {
  it("gives the same order for the same seed", () => {
    expect(seededShuffle(items, "attempt-1")).toEqual(seededShuffle(items, "attempt-1"));
  });

  it("gives different orders for different seeds", () => {
    expect(seededShuffle(items, "attempt-1")).not.toEqual(seededShuffle(items, "attempt-2"));
  });

  it("keeps every item exactly once", () => {
    expect([...seededShuffle(items, "attempt-1")].sort((a, b) => a - b)).toEqual(items);
  });

  it("does not change the input array", () => {
    const input = [1, 2, 3, 4, 5];
    seededShuffle(input, "seed");
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("actually reorders a list", () => {
    expect(seededShuffle(items, "attempt-1")).not.toEqual(items);
  });

  it("handles empty and single-item lists", () => {
    expect(seededShuffle([], "seed")).toEqual([]);
    expect(seededShuffle(["only"], "seed")).toEqual(["only"]);
  });

  it("spreads first positions across seeds instead of favouring one item", () => {
    const firsts = new Set(Array.from({ length: 200 }, (_, i) => seededShuffle([0, 1, 2, 3], `seed-${i}`)[0]));
    expect(firsts.size).toBe(4);
  });
});
