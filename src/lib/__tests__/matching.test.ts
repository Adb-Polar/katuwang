import { describe, it, expect } from "vitest";
import { scoreClass, rankMatches, ClassForMatching } from "@/lib/matching";

const NOW = new Date("2026-03-02T08:00:00Z"); // a Monday

function daysFromNow(days: number, hour = 15, minute = 0): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function mkClass(overrides: Partial<ClassForMatching> = {}): ClassForMatching {
  return {
    id: "c1",
    subject: "MATH",
    gradeLevel: null,
    topics: ["Algebraic Expressions"],
    verifiedTopics: [],
    sessions: [{ scheduledAt: daysFromNow(3), duration: 60, status: "SCHEDULED" }],
    maxStudents: 3,
    enrollmentCount: 0,
    status: "SCHEDULED",
    published: true,
    ...overrides,
  };
}

const baseCriteria = { subject: "MATH" as const, topics: ["Algebraic Expressions"] };

describe("scoreClass — hard filters", () => {
  it("excludes a different subject", () => {
    expect(scoreClass(baseCriteria, mkClass({ subject: "ENGLISH" }), NOW)).toBeNull();
  });

  it("excludes when no requested topic overlaps", () => {
    expect(scoreClass(baseCriteria, mkClass({ topics: ["Trigonometry"] }), NOW)).toBeNull();
  });

  it("excludes a full class", () => {
    expect(scoreClass(baseCriteria, mkClass({ enrollmentCount: 3, maxStudents: 3 }), NOW)).toBeNull();
  });

  it("excludes an unpublished or non-scheduled class", () => {
    expect(scoreClass(baseCriteria, mkClass({ published: false }), NOW)).toBeNull();
    expect(scoreClass(baseCriteria, mkClass({ status: "COMPLETED" }), NOW)).toBeNull();
  });

  it("excludes a class with no upcoming scheduled session", () => {
    expect(
      scoreClass(baseCriteria, mkClass({ sessions: [{ scheduledAt: daysFromNow(-1), duration: 60, status: "SCHEDULED" }] }), NOW)
    ).toBeNull();
  });

  it("classFormat SOLO keeps only 1-on-1 classes", () => {
    const solo = { ...baseCriteria, classFormat: "SOLO" as const };
    expect(scoreClass(solo, mkClass({ maxStudents: 1 }), NOW)).not.toBeNull();
    expect(scoreClass(solo, mkClass({ maxStudents: 4 }), NOW)).toBeNull();
  });

  it("classFormat GROUP keeps only multi-seat classes", () => {
    const group = { ...baseCriteria, classFormat: "GROUP" as const };
    expect(scoreClass(group, mkClass({ maxStudents: 4 }), NOW)).not.toBeNull();
    expect(scoreClass(group, mkClass({ maxStudents: 1 }), NOW)).toBeNull();
  });

  it("classFormat ANY / undefined does not filter by capacity", () => {
    expect(scoreClass({ ...baseCriteria, classFormat: "ANY" }, mkClass({ maxStudents: 1 }), NOW)).not.toBeNull();
    expect(scoreClass({ ...baseCriteria, classFormat: "ANY" }, mkClass({ maxStudents: 6 }), NOW)).not.toBeNull();
  });
});

describe("scoreClass — scoring", () => {
  it("scores more matched topics higher", () => {
    const criteria = { subject: "MATH" as const, topics: ["Algebraic Expressions", "Trigonometry"] };
    const one = scoreClass(criteria, mkClass({ topics: ["Algebraic Expressions"] }), NOW)!;
    const two = scoreClass(criteria, mkClass({ topics: ["Algebraic Expressions", "Trigonometry"] }), NOW)!;
    expect(two.score).toBeGreaterThan(one.score);
    expect(two.reasons.matchedTopics).toEqual(["Algebraic Expressions", "Trigonometry"]);
  });

  it("adds a bonus for a verified matched topic", () => {
    const plain = scoreClass(baseCriteria, mkClass(), NOW)!;
    const verified = scoreClass(baseCriteria, mkClass({ verifiedTopics: ["Algebraic Expressions"] }), NOW)!;
    expect(verified.score).toBeGreaterThan(plain.score);
    expect(verified.reasons.verifiedMatchedTopics).toEqual(["Algebraic Expressions"]);
  });

  it("credits sessions that fall inside a preferred slot", () => {
    // daysFromNow(3) from a Monday = Thursday 15:00
    const criteria = {
      ...baseCriteria,
      preferredSlots: [{ day: "THURSDAY", startTime: "14:00", endTime: "16:00" }],
    };
    const fit = scoreClass(criteria, mkClass(), NOW)!;
    const noFit = scoreClass(
      { ...baseCriteria, preferredSlots: [{ day: "SUNDAY", startTime: "14:00", endTime: "16:00" }] },
      mkClass(),
      NOW
    )!;
    expect(fit.reasons.scheduleFitCount).toBe(1);
    expect(noFit.reasons.scheduleFitCount).toBe(0);
    expect(fit.score).toBeGreaterThan(noFit.score);
  });

  it("ranks grade fit exact > adjacent > any > mismatch", () => {
    const withGrade = (g: ClassForMatching["gradeLevel"]) =>
      scoreClass({ ...baseCriteria, gradeLevel: "GRADE_9" }, mkClass({ gradeLevel: g }), NOW)!;
    expect(withGrade("GRADE_9").score).toBeGreaterThan(withGrade("GRADE_10").score);
    expect(withGrade("GRADE_10").score).toBeGreaterThan(withGrade(null).score);
    expect(withGrade(null).score).toBeGreaterThan(withGrade("GRADE_12").score);
    expect(withGrade("GRADE_9").reasons.gradeMatch).toBe("exact");
    expect(withGrade("GRADE_12").reasons.gradeMatch).toBe("none");
  });
});

describe("rankMatches", () => {
  it("returns matches best-first and drops non-matches", () => {
    const criteria = { subject: "MATH" as const, topics: ["Algebraic Expressions", "Trigonometry"] };
    const classes: ClassForMatching[] = [
      mkClass({ id: "weak", topics: ["Algebraic Expressions"] }),
      mkClass({ id: "strong", topics: ["Algebraic Expressions", "Trigonometry"], verifiedTopics: ["Trigonometry"] }),
      mkClass({ id: "other-subject", subject: "SCIENCE" }),
    ];
    const ranked = rankMatches(criteria, classes, NOW);
    expect(ranked.map((r) => r.class.id)).toEqual(["strong", "weak"]);
  });

  it("prefers the class whose next session is sooner", () => {
    const classes: ClassForMatching[] = [
      mkClass({ id: "later", sessions: [{ scheduledAt: daysFromNow(9), duration: 60, status: "SCHEDULED" }] }),
      mkClass({ id: "sooner", sessions: [{ scheduledAt: daysFromNow(2), duration: 60, status: "SCHEDULED" }] }),
    ];
    const ranked = rankMatches(baseCriteria, classes, NOW);
    expect(ranked[0].class.id).toBe("sooner");
  });
});
