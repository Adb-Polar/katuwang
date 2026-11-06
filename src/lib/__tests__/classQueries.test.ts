import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { hasClassStarted, browseClassesWhere, browsableOrEnrolledWhere, myClassesWhere, toLearnerClassDTO } from "@/lib/classQueries";

// Minimal row shaped like `learnerClassInclude`'s payload.
function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    subject: "MATH",
    status: "SCHEDULED",
    published: true,
    suspendedReason: null,
    suspendedUntil: null,
    createdAt: new Date("2026-08-01"),
    topics: [{ topic: "Fractions & Decimals" }, { topic: "Algebra Basics" }],
    sessions: [],
    _count: { enrollments: 2 },
    enrollments: [],
    tutorProfile: {
      id: "tp1",
      user: {
        id: "u1",
        anonymousId: "TUT-0007",
        firstName: "Maria",
        lastName: "Santos",
        section: "Rizal",
      },
      topicCertifications: [{ subject: "MATH", topic: "Fractions & Decimals" }],
    },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("toLearnerClassDTO", () => {
  it("exposes only the anonymised tutor ID by default (double-blind)", () => {
    const dto = toLearnerClassDTO(makeRow());
    expect(dto.tutor).toEqual({ id: "u1", anonymousId: "TUT-0007" });
    expect(dto.topics).toEqual(["Fractions & Decimals", "Algebra Basics"]);
    expect(dto.verifiedTopics).toEqual(["Fractions & Decimals"]);
  });

  it("includes the real name + section when showRealNames is true", () => {
    const dto = toLearnerClassDTO(makeRow(), true);
    expect(dto.tutor).toEqual({
      id: "u1",
      anonymousId: "TUT-0007",
      name: "Maria Santos",
      section: "Rizal",
    });
  });

  it("carries the moderation scalars straight through", () => {
    const until = new Date("2026-09-15");
    const dto = toLearnerClassDTO(makeRow({ status: "SUSPENDED", suspendedReason: "Policy review", suspendedUntil: until }));
    expect(dto.status).toBe("SUSPENDED");
    expect(dto.suspendedReason).toBe("Policy review");
    expect(dto.suspendedUntil).toBe(until);
  });
});

describe("grade eligibility query builders", () => {
  it("gradeEligibilityWhere restricts tutor grade >= student grade and target grade >= student grade or null", async () => {
    const { gradeEligibilityWhere } = await import("@/lib/classQueries");
    const where = gradeEligibilityWhere("GRADE_9");
    expect(where.tutorProfile).toEqual({
      user: {
        gradeLevel: { in: ["GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"] },
      },
    });
    expect(where.OR).toEqual([
      { gradeLevel: null },
      { gradeLevel: { in: ["GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"] } },
    ]);
  });

  it("browseClassesWhere has no learner or tutor grade restriction", async () => {
    const { browseClassesWhere } = await import("@/lib/classQueries");
    const where = browseClassesWhere("u1");
    expect(where.enrollments).toEqual({ none: { learnerId: "u1" } });
    expect(where).not.toHaveProperty("tutorProfile");
    expect(where).not.toHaveProperty("OR");
    expect(where).not.toHaveProperty("gradeLevel");
  });

  it("browsableOrEnrolledWhere applies grade eligibility to browsable branch but allows enrolled classes", async () => {
    const { browsableOrEnrolledWhere } = await import("@/lib/classQueries");
    const where = browsableOrEnrolledWhere("u1", "GRADE_8");
    expect(where.OR).toBeDefined();
    expect(where.OR?.length).toBe(2);
    const schedBranch = where.OR?.[0] as Prisma.TutorClassWhereInput;
    expect(schedBranch.status).toBe("SCHEDULED");
    expect(schedBranch.tutorProfile).toEqual({
      user: {
        gradeLevel: { in: ["GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"] },
      },
    });
    const enrollBranch = where.OR?.[1] as Prisma.TutorClassWhereInput;
    expect(enrollBranch.enrollments).toEqual({ some: { learnerId: "u1" } });
  });
});


describe("class enrollment cutoff", () => {
  const now = new Date("2026-11-06T08:00:00Z").getTime();

  it("closes at the first session start even if later sessions are still upcoming", () => {
    expect(hasClassStarted([{ scheduledAt: new Date(now + 1) }], now)).toBe(false);
    expect(hasClassStarted([
      { scheduledAt: new Date(now + 86_400_000) },
      { scheduledAt: new Date(now) },
    ], now)).toBe(true);
    expect(hasClassStarted([{ scheduledAt: new Date(now - 1).toISOString() }], now)).toBe(true);
  });

  it("applies the same session cutoff to browse and matching while preserving enrolled access", () => {
    const cutoff = {
      some: { status: "SCHEDULED", scheduledAt: { gt: expect.any(Date) } },
      none: { scheduledAt: { lte: expect.any(Date) } },
    };
    expect(browseClassesWhere("l1")).toEqual({
      status: "SCHEDULED", published: true, sessions: cutoff,
      enrollments: { none: { learnerId: "l1" } },
    });
    expect(browsableOrEnrolledWhere("l1")).toEqual({ OR: [
      { status: "SCHEDULED", published: true, sessions: cutoff },
      { enrollments: { some: { learnerId: "l1" } } },
    ] });
    expect(myClassesWhere("l1")).toEqual({ enrollments: { some: { learnerId: "l1" } } });
  });
});
