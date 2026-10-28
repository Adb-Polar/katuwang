import { describe, it, expect } from "vitest";
import { seedGrade, seedGrades, seedTopicsForGrade } from "../seedCatalogHelpers";

describe("grouped seed fixtures", () => {
  it("rejects removed names and topics assigned to the wrong group", () => {
    expect(() => seedGrades("TLE", ["Cooking & Food Preparation"])).toThrow();
    expect(() => seedGrades("MATH", ["Algebraic Expressions"])).toThrow();
    expect(() => seedGrades("MATH", ["Cooking & Food Preparation"])).toThrow();
    expect(() => seedGrades("MATH", [])).toThrow();
  });
  it("prevents multi-topic classes spanning incompatible grade ranges", () => {
    expect(() => seedGrades("MATH", ["Whole Numbers & Operations", "Integration"])).toThrow(/common grade/);
    expect(seedGrades("MATH", ["Algebraic Expressions & Factoring", "Linear Equations & Inequalities"])).toEqual(["GRADE_7", "GRADE_8"]);
  });
  it("keeps compatible requested grades and replaces incompatible demo grades", () => {
    expect(seedGrade("MATH", ["Algebraic Expressions & Factoring"], "GRADE_8")).toBe("GRADE_8");
    expect(seedGrade("MATH", ["Algebraic Expressions & Factoring"], "GRADE_12")).toBe("GRADE_7");
    expect(seedGrade("MISCELLANEOUS", ["Baking & Pastry"], "GRADE_11")).toBe("GRADE_11");
  });
  it("samples additional topics only from the selected grade", () => {
    expect(seedTopicsForGrade("MATH", "GRADE_7")).not.toContain("Integration");
    expect(seedTopicsForGrade("MISCELLANEOUS", "GRADE_12")).toContain("Server Administration");
    expect(seedTopicsForGrade("SHS_TVL_COOKERY", "GRADE_11")).toEqual([]);
  });
});
