import { describe, it, expect } from "vitest";
import {
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

  describe("isStudentEligibleForTutor", () => {
    it("allows studentGrade <= tutorGrade", () => {
      expect(isStudentEligibleForTutor("GRADE_7", "GRADE_9")).toBe(true);
      expect(isStudentEligibleForTutor("GRADE_8", "GRADE_9")).toBe(true);
      expect(isStudentEligibleForTutor("GRADE_9", "GRADE_9")).toBe(true);
    });

    it("rejects studentGrade > tutorGrade", () => {
      // Grade 10 student cannot be taught by Grade 9 tutor
      expect(isStudentEligibleForTutor("GRADE_10", "GRADE_9")).toBe(false);
      expect(isStudentEligibleForTutor("GRADE_11", "GRADE_9")).toBe(false);
      expect(isStudentEligibleForTutor("GRADE_12", "GRADE_9")).toBe(false);
    });
  });

  describe("isStudentEligibleForClassTarget", () => {
    it("allows studentGrade <= targetGrade", () => {
      expect(isStudentEligibleForClassTarget("GRADE_7", "GRADE_8")).toBe(true);
      expect(isStudentEligibleForClassTarget("GRADE_8", "GRADE_8")).toBe(true);
    });

    it("rejects when class target grade is below student grade", () => {
      // Grade 9 student cannot enroll in a class whose target grade is Grade 8
      expect(isStudentEligibleForClassTarget("GRADE_9", "GRADE_8")).toBe(false);
      expect(isStudentEligibleForClassTarget("GRADE_10", "GRADE_8")).toBe(false);
    });

    it("allows null/empty targetGrade", () => {
      expect(isStudentEligibleForClassTarget("GRADE_9", null)).toBe(true);
      expect(isStudentEligibleForClassTarget("GRADE_9", undefined)).toBe(true);
      expect(isStudentEligibleForClassTarget("GRADE_9", "")).toBe(true);
    });
  });

  describe("isStudentEligibleForClass (Complete 3-way check)", () => {
    it("evaluates studentGrade <= tutorGrade AND studentGrade <= targetGrade", () => {
      // Grade 9 student, Grade 10 tutor, Grade 9 target -> Eligible
      expect(isStudentEligibleForClass("GRADE_9", "GRADE_10", "GRADE_9")).toBe(true);

      // Grade 9 student, Grade 10 tutor, Grade 10 target -> Eligible (9 <= 10 and 9 <= 10)
      expect(isStudentEligibleForClass("GRADE_9", "GRADE_10", "GRADE_10")).toBe(true);

      // Grade 9 student, Grade 9 tutor, Grade 9 target -> Eligible
      expect(isStudentEligibleForClass("GRADE_9", "GRADE_9", "GRADE_9")).toBe(true);

      // Grade 9 student, Grade 8 tutor -> Ineligible (student > tutor)
      expect(isStudentEligibleForClass("GRADE_9", "GRADE_8", "GRADE_8")).toBe(false);

      // Grade 9 student, Grade 10 tutor, Grade 8 target -> Ineligible (student > target)
      expect(isStudentEligibleForClass("GRADE_9", "GRADE_10", "GRADE_8")).toBe(false);

      // Grade 9 student, Grade 10 tutor, null target -> Eligible
      expect(isStudentEligibleForClass("GRADE_9", "GRADE_10", null)).toBe(true);

      // Grade 11 student, Grade 10 tutor, null target -> Ineligible (11 > 10)
      expect(isStudentEligibleForClass("GRADE_11", "GRADE_10", null)).toBe(false);
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

  describe("getEligibleTutorGradesForStudent", () => {
    it("returns tutor grades >= student's grade", () => {
      expect(getEligibleTutorGradesForStudent("GRADE_9")).toEqual([
        "GRADE_9",
        "GRADE_10",
        "GRADE_11",
        "GRADE_12",
      ]);

      expect(getEligibleTutorGradesForStudent("GRADE_12")).toEqual(["GRADE_12"]);
      expect(getEligibleTutorGradesForStudent("GRADE_7").length).toBe(6);
    });
  });

  describe("getEligibleClassTargetGradesForStudent", () => {
    it("returns class target grades >= student's grade", () => {
      expect(getEligibleClassTargetGradesForStudent("GRADE_9")).toEqual([
        "GRADE_9",
        "GRADE_10",
        "GRADE_11",
        "GRADE_12",
      ]);
      expect(getEligibleClassTargetGradesForStudent("GRADE_12")).toEqual(["GRADE_12"]);
      expect(getEligibleClassTargetGradesForStudent("GRADE_7").length).toBe(6);
    });
  });

  describe("getEligibleStudentGradesForTutor", () => {
    it("returns student grades <= tutor's grade", () => {
      expect(getEligibleStudentGradesForTutor("GRADE_9")).toEqual([
        "GRADE_7",
        "GRADE_8",
        "GRADE_9",
      ]);
      expect(getEligibleStudentGradesForTutor("GRADE_7")).toEqual(["GRADE_7"]);
      expect(getEligibleStudentGradesForTutor("GRADE_12").length).toBe(6);
    });
  });

  describe("display helpers", () => {
    it("formats grade label and section", () => {
      expect(gradeLabel("GRADE_10")).toBe("GRADE 10");
      expect(gradeSection("GRADE_10", "Rizal")).toBe("GRADE 10 · Rizal");
    });
  });
});
