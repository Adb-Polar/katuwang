import { describe, it, expect } from "vitest";
import { seededShuffle, shuffle } from "@/lib/shuffle";

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

describe("seededShuffle", () => {
  it("returns the same order for the same seed", () => {
    expect(seededShuffle(LETTERS, "item-1")).toEqual(seededShuffle(LETTERS, "item-1"));
  });

  it("returns different orders for different seeds", () => {
    const orders = new Set(["s1", "s2", "s3", "s4", "s5"].map((seed) => seededShuffle(LETTERS, seed).join("")));
    expect(orders.size).toBeGreaterThan(1);
  });

  it("keeps every element exactly once", () => {
    expect([...seededShuffle(LETTERS, "x")].sort()).toEqual(LETTERS);
  });

  it("does not mutate its input", () => {
    const input = [...LETTERS];
    seededShuffle(input, "x");
    expect(input).toEqual(LETTERS);
  });

  it("handles empty and single-element lists", () => {
    expect(seededShuffle([], "x")).toEqual([]);
    expect(seededShuffle(["only"], "x")).toEqual(["only"]);
  });
});

describe("shuffle", () => {
  it("uses the supplied random source", () => {
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });
});
