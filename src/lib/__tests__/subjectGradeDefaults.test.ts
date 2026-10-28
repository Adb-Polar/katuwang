import { describe, expect, it } from "vitest";
import { SUBJECT_SLUGS } from "../subjectTopics";
import { GRADE_LEVELS } from "../gradeLevels";
import { defaultSubjectGrades, SUBJECT_GRADE_DEFAULTS } from "../subjectGradeDefaults";
import { subjectsInGrade, topicsInGrade } from "../catalogGrades";

describe("Approved grouped subject grade defaults", () => {
  it("covers every built-in subject with explicit valid grades", () => {
    expect(Object.keys(SUBJECT_GRADE_DEFAULTS).sort()).toEqual([...SUBJECT_SLUGS].sort());
    for (const slug of SUBJECT_SLUGS) {
      const grades = defaultSubjectGrades(slug)!;
      expect(grades.length).toBeGreaterThan(0);
      expect(grades.every((g) => GRADE_LEVELS.some((level) => level.value === g))).toBe(true);
    }
  });
  it("includes SHS only where the group has explicitly assigned SHS topics", () => {
    const catalog = SUBJECT_SLUGS.map((slug) => ({ slug, gradeLevels: defaultSubjectGrades(slug), topics: ["Example"] }));
    for (const grade of ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10"]) expect(subjectsInGrade(catalog, grade)).toHaveLength(10);
    expect(subjectsInGrade(catalog, "GRADE_11").some((s) => s.slug === "MATH")).toBe(true);
    expect(topicsInGrade(catalog[0], "GRADE_12")).toEqual([]);
  });
  it("leaves custom subjects to admin assignment and returns independent arrays", () => {
    expect(defaultSubjectGrades("CUSTOM_SUBJECT")).toBeUndefined();
    defaultSubjectGrades("MATH")!.push("GRADE_12");
    expect(defaultSubjectGrades("MATH")).not.toContain("GRADE_12");
  });
});
