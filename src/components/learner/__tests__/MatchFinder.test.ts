import { describe, expect, it } from "vitest";
import { groupByFit, reasonLine } from "../MatchFinder";

const base = { matchedTopics: [] as string[], verifiedMatchedTopics: [] as string[], scheduleFitCount: 0, gradeMatch: "none" as const };

describe("reasonLine", () => {
  it("summarises every reason in one plain sentence", () => {
    expect(reasonLine({ matchedTopics: ["Algebra"], verifiedMatchedTopics: ["Algebra"], scheduleFitCount: 2, gradeMatch: "exact" }, 1))
      .toBe("Covers your topic · tutor certified in it · fits 2 of your times · your grade");
  });

  it("says how many of several searched topics a class covers", () => {
    expect(reasonLine({ ...base, matchedTopics: ["A"], gradeMatch: "adjacent" }, 3)).toBe("Covers 1 of your 3 topics · near your grade");
    expect(reasonLine({ ...base, matchedTopics: ["A", "B"] }, 2)).toBe("Covers all your topics");
  });

  it("falls back to a neutral line when no reason applies", () => {
    expect(reasonLine(base, 1)).toBe("Open class in this subject");
  });
});

describe("groupByFit", () => {
  it("puts every top-scoring result in one group and the rest in a second", () => {
    expect(groupByFit([{ score: 9 }, { score: 9 }, { score: 4 }, { score: 2 }])).toEqual([[{ score: 9 }, { score: 9 }], [{ score: 4 }, { score: 2 }]]);
  });

  it("returns a single group when all scores tie, and nothing for no results", () => {
    expect(groupByFit([{ score: 5 }, { score: 5 }])).toEqual([[{ score: 5 }, { score: 5 }]]);
    expect(groupByFit([])).toEqual([]);
  });
});
