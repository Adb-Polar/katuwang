import { describe, expect, it } from "vitest";
import { tutorPublicFacts, type TutorPublicFactsInput } from "@/lib/tutorPublicFacts";

const base: TutorPublicFactsInput = {
  gradeLevel: "GRADE_10",
  section: "Rizal",
  certifiedSubjects: ["SCIENCE", "MATH", "MATH"],
  publishedClassCount: 3,
  completedSessionCount: 12,
  tutorSince: new Date("2026-06-15T04:00:00.000Z"),
};
const fact = (input: TutorPublicFactsInput, label: string) => tutorPublicFacts(input).find((f) => f.label === label)?.value;

describe("tutorPublicFacts", () => {
  it("shows the tutor's grade level and section", () => {
    expect(fact(base, "Grade level")).toBe("Grade 10");
    expect(fact(base, "Section")).toBe("Rizal");
  });

  it("lists each certified subject once, by name, in alphabetical order", () => {
    const subjects = fact(base, "Certified subjects")!.split(", ");
    expect(subjects).toHaveLength(2);
    expect(subjects).toEqual([...subjects].sort((a, b) => a.localeCompare(b)));
  });

  it("says so when the tutor has no certified subject yet", () => {
    expect(fact({ ...base, certifiedSubjects: [] }, "Certified subjects")).toBe("None yet");
  });

  it("uses singular and plural counts", () => {
    expect(fact(base, "Classes offered")).toBe("3 classes");
    expect(fact({ ...base, publishedClassCount: 1 }, "Classes offered")).toBe("1 class");
    expect(fact({ ...base, completedSessionCount: 0 }, "Sessions completed")).toBe("0 sessions");
    expect(fact({ ...base, completedSessionCount: 1 }, "Sessions completed")).toBe("1 session");
  });

  it("gives the month the tutor joined, in school time", () => {
    // 31 May 16:30 UTC is already 1 June in the Philippines.
    expect(fact({ ...base, tutorSince: new Date("2026-05-31T16:30:00.000Z") }, "Tutor since")).toBe("June 2026");
  });

  it("leaves out a blank section", () => {
    expect(fact({ ...base, section: "  " }, "Section")).toBeUndefined();
    expect(fact({ ...base, section: null }, "Section")).toBeUndefined();
  });

  it("never carries identifying fields", () => {
    const labels = tutorPublicFacts(base).map((f) => f.label.toLowerCase());
    for (const banned of ["name", "email", "contact", "lrn", "adviser"]) {
      expect(labels.some((label) => label.includes(banned))).toBe(false);
    }
  });
});
