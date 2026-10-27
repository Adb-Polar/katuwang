import { describe, expect, it } from "vitest";
import { availableInGrade, subjectsInGrade, topicsInGrade } from "../catalogGrades";
const math = { slug: "MATH", gradeLevels: ["GRADE_7"], topics: ["Numbers", "Algebra"], topicGrades: { Numbers: ["GRADE_7"], Algebra: ["GRADE_8"] } };
describe("grade-scoped catalog", () => {
  it("keeps legacy unassigned entries available", () => {
    expect(availableInGrade(null, "GRADE_7")).toBe(true);
    expect(availableInGrade([], "GRADE_8")).toBe(true);
  });
  it("filters subjects and topics by grade and parent membership", () => {
    expect(subjectsInGrade([math], "GRADE_8")).toEqual([]);
    expect(topicsInGrade(math, "GRADE_7")).toEqual(["Numbers"]);
    expect(topicsInGrade(math, "GRADE_8")).toEqual([]);
    expect(topicsInGrade(undefined, "GRADE_7")).toEqual([]);
  });
  it("returns the full catalog when grade is unfiltered", () => {
    expect(topicsInGrade(math)).toEqual(["Numbers", "Algebra"]);
  });
});
