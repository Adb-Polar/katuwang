import { describe, it, expect } from "vitest";
import {
  ALL_GRADE_LEVELS,
  gradeNumber,
  compareGradeLevels,
  isTargetGradeEligibleForTutor,
  isStudentEligibleForTutor,
  isStudentEligibleForClassTarget,
  isStudentEligibleForClass,
  getEligibleTargetGrades,
  getEligibleTutorGradesForStudent,
  getEligibleClassTargetGradesForStudent,
  getEligibleStudentGradesForTutor,
  gradeLabel,
  gradeSection,
} from "@/lib/gradeLevels";

describe("gradeLevels utility", () => {
  describe("gradeNumber", () => {
    it("extracts correct numeric value from GradeLevel enum values", () => {
      expect(gradeNumber("GRADE_7")).toBe(7);
      expect(gradeNumber("GRADE_8")).toBe(8);
      expect(gradeNumber("GRADE_9")).toBe(9);
      expect(gradeNumber("GRADE_10")).toBe(10);
      expect(gradeNumber("GRADE_11")).toBe(11);
      expect(gradeNumber("GRADE_12")).toBe(12);
    });

    it("handles arbitrary grade strings or returns 0 for falsy", () => {
      expect(gradeNumber("Grade 9")).toBe(9);
      expect(gradeNumber("9")).toBe(9);
      expect(gradeNumber(null)).toBe(0);
      expect(gradeNumber(undefined)).toBe(0);
      expect(gradeNumber("")).toBe(0);
    });
  });

  describe("compareGradeLevels", () => {
    it("compares grades correctly", () => {
      expect(compareGradeLevels("GRADE_10", "GRADE_9")).toBeGreaterThan(0);
      expect(compareGradeLevels("GRADE_7", "GRADE_8")).toBeLessThan(0);
      expect(compareGradeLevels("GRADE_9", "GRADE_9")).toBe(0);
    });
  });

  describe("isTargetGradeEligibleForTutor (Tutor Class Creation)", () => {
    it("allows targetGrade <= tutorGrade", () => {
      // Grade 9 tutor
      expect(isTargetGradeEligibleForTutor("GRADE_9", "GRADE_9")).toBe(true);
      expect(isTargetGradeEligibleForTutor("GRADE_8", "GRADE_9")).toBe(true);
      expect(isTargetGradeEligibleForTutor("GRADE_7", "GRADE_9")).toBe(true);
    });

    it("rejects targetGrade > tutorGrade", () => {
      // Grade 9 tutor cannot target Grade 10, 11, or 12
      expect(isTargetGradeEligibleForTutor("GRADE_10", "GRADE_9")).toBe(false);
      expect(isTargetGradeEligibleForTutor("GRADE_11", "GRADE_9")).toBe(false);
      expect(isTargetGradeEligibleForTutor("GRADE_12", "GRADE_9")).toBe(false);
    });

    it("allows null/empty targetGrade (Any grade)", () => {
      expect(isTargetGradeEligibleForTutor(null, "GRADE_9")).toBe(true);
      expect(isTargetGradeEligibleForTutor(undefined, "GRADE_9")).toBe(true);
      expect(isTargetGradeEligibleForTutor("", "GRADE_9")).toBe(true);
    });
  });

  describe("any-grade learner policy", () => {
    it.each([...ALL_GRADE_LEVELS, null].flatMap(student => [...ALL_GRADE_LEVELS, null].map(tutor => [student, tutor]))) ("permits learner %s with tutor/target %s", (student, tutor) => {
      expect(isStudentEligibleForTutor(student, tutor)).toBe(true);
      expect(isStudentEligibleForClassTarget(student, tutor)).toBe(true);
      expect(isStudentEligibleForClass(student, tutor, tutor)).toBe(true);
    });
  });

  describe("getEligibleTargetGrades for tutor", () => {
    it("returns grades <= tutor's grade", () => {
      const g9TargetGrades = getEligibleTargetGrades("GRADE_9");
      expect(g9TargetGrades.map((g) => g.value)).toEqual(["GRADE_7", "GRADE_8", "GRADE_9"]);

      const g7TargetGrades = getEligibleTargetGrades("GRADE_7");
      expect(g7TargetGrades.map((g) => g.value)).toEqual(["GRADE_7"]);

      const g12TargetGrades = getEligibleTargetGrades("GRADE_12");
      expect(g12TargetGrades.length).toBe(6);
    });
  });

  it.each([...ALL_GRADE_LEVELS, null])("offers every discovery/request grade for %s", (grade) => {
    expect(getEligibleTutorGradesForStudent(grade)).toEqual(ALL_GRADE_LEVELS);
    expect(getEligibleClassTargetGradesForStudent(grade)).toEqual(ALL_GRADE_LEVELS);
    expect(getEligibleStudentGradesForTutor(grade)).toEqual(ALL_GRADE_LEVELS);
  });

  describe("display helpers", () => {
    it("formats grade label and section", () => {
      expect(gradeLabel("GRADE_10")).toBe("GRADE 10");
      expect(gradeSection("GRADE_10", "Rizal")).toBe("GRADE 10 · Rizal");
    });
  });
});
