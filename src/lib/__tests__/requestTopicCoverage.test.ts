import { describe, expect, it } from "vitest";
import { missingRequestedTopics } from "@/lib/requestTopicCoverage";
describe("requested class coverage", () => {
  it("requires every requested topic and permits additional topics", () => {
    expect(missingRequestedTopics(["Algebra", "Geometry"], ["Algebra"])).toEqual(["Geometry"]);
    expect(missingRequestedTopics(["Algebra", "Geometry"], ["Algebra", "Geometry", "Statistics"])).toEqual([]);
  });
  it("compares case and whitespace consistently", () => {
    expect(missingRequestedTopics(["  Linear   Equations "], ["linear equations"])).toEqual([]);
  });
});
