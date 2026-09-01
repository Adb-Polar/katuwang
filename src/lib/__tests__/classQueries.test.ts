import { describe, it, expect } from "vitest";
import { toLearnerClassDTO } from "@/lib/classQueries";

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
