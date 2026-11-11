import { describe, it, expect } from "vitest";
import { seedGrade, seedGrades, seedTopicsForGrade } from "../seedCatalogHelpers";

describe("source-backed seed fixtures", () => {
  it("rejects broad historical labels instead of inventing official matches", () => {
    expect(() => seedGrades("MATH", ["Algebraic Expressions & Factoring"])).toThrow();
    expect(() => seedGrades("MATH", ["Cooking & Food Preparation"])).toThrow();
    expect(() => seedGrades("MATH", [])).toThrow();
  });
  it("prevents topic combinations with no common grade", () => {
    expect(() => seedGrades("MATH", ["Measurement", "Patterns and Algebra"])).not.toThrow();
    expect(seedGrades("MATH", ["Measurement", "Patterns and Algebra"])).toEqual(["GRADE_7"]);
  });
  it("keeps compatible requested grades and rejects cross-course assumptions", () => {
    expect(seedGrade("MATH", ["Patterns and Algebra"], "GRADE_8")).toBe("GRADE_8");
    expect(seedGrade("MATH", ["Patterns and Algebra"], "GRADE_12")).toBe("GRADE_7");
    expect(seedGrade("SSHS_BAKERY_OPERATIONS", ["Bread Products"], "GRADE_11")).toBe("GRADE_11");
    expect(() => seedGrade("MATH", ["Limits and Continuity"])).toThrow();
  });
  it("samples only from a subject’s sourced grades", () => {
    expect(seedTopicsForGrade("MATH", "GRADE_12")).toEqual([]);
    expect(seedTopicsForGrade("SSHS_DATABASE_MANAGEMENT", "GRADE_12")).toContain("Introduction to SQL");
    expect(seedTopicsForGrade("SSHS_DATABASE_MANAGEMENT", "GRADE_11")).toEqual([]);
  });
});
