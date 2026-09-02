import { describe, it, expect } from "vitest";
import { rankBrowseClasses, scoreBrowseClass, type RankableClass } from "@/lib/browseRanking";

const NOW = new Date("2026-09-01T09:00:00Z");

function cls(over: Partial<RankableClass> = {}): RankableClass {
  return {
    subject: "MATH",
    gradeLevel: null,
    topics: [],
    maxStudents: 3,
    createdAt: new Date("2026-08-01"),
    sessions: [{ scheduledAt: new Date("2026-09-05T09:00:00Z"), status: "SCHEDULED" }],
    _count: { enrollments: 0 },
    ...over,
  };
}

const emptyCtx = { gradeLevel: null, interestSubjects: new Set<string>(), interestTopics: new Set<string>() };

describe("scoreBrowseClass", () => {
  it("rewards an interest-subject match", () => {
    const ctx = { ...emptyCtx, interestSubjects: new Set(["MATH"]) };
    expect(scoreBrowseClass(ctx, cls(), NOW)).toBeGreaterThan(scoreBrowseClass(emptyCtx, cls(), NOW));
  });

  it("rewards an exact grade match over none", () => {
    const ctx = { ...emptyCtx, gradeLevel: "GRADE_9" as const };
    const exact = scoreBrowseClass(ctx, cls({ gradeLevel: "GRADE_9" }), NOW);
    const far = scoreBrowseClass(ctx, cls({ gradeLevel: "GRADE_12" }), NOW);
    expect(exact).toBeGreaterThan(far);
  });

  it("rewards a sooner next session", () => {
    const soon = scoreBrowseClass(emptyCtx, cls({ sessions: [{ scheduledAt: new Date("2026-09-02T09:00:00Z"), status: "SCHEDULED" }] }), NOW);
    const later = scoreBrowseClass(emptyCtx, cls({ sessions: [{ scheduledAt: new Date("2026-09-20T09:00:00Z"), status: "SCHEDULED" }] }), NOW);
    expect(soon).toBeGreaterThan(later);
  });

  it("gives no soonness credit for a class with no upcoming session", () => {
    const none = scoreBrowseClass(emptyCtx, cls({ sessions: [] }), NOW);
    const some = scoreBrowseClass(emptyCtx, cls(), NOW);
    expect(some).toBeGreaterThan(none);
  });
});

describe("rankBrowseClasses", () => {
  it("orders by score desc, then newest first as a tiebreak", () => {
    const ctx = { ...emptyCtx, interestSubjects: new Set(["SCIENCE"]) };
    const a = cls({ subject: "MATH", createdAt: new Date("2026-08-25") }); // newer, no interest
    const b = cls({ subject: "SCIENCE", createdAt: new Date("2026-08-02") }); // older, interest match
    const [first, second] = rankBrowseClasses(ctx, [a, b], NOW);
    expect(first).toBe(b);
    expect(second).toBe(a);
  });

  it("is a pure function (input array not mutated)", () => {
    const arr = [cls({ createdAt: new Date("2026-08-01") }), cls({ createdAt: new Date("2026-08-10") })];
    const copy = [...arr];
    rankBrowseClasses(emptyCtx, arr, NOW);
    expect(arr).toEqual(copy);
  });
});
