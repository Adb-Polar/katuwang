import { describe, it, expect, vi, beforeEach } from "vitest";

const { sessionTestFindUnique, tutorClassFindUnique } = vi.hoisted(() => ({
  sessionTestFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sessionTest: { findUnique: sessionTestFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
  },
}));

import { buildSessionTestResults, buildClassSessionTestRollup } from "@/lib/sessionTestResults";

beforeEach(() => vi.clearAllMocks());

function attempt(learnerId: string, kind: "PRE" | "POST", scorePercent: number, items: { position: number; isCorrect: boolean | null }[]) {
  return { learnerId, kind, scorePercent, id: `at-${learnerId}-${kind}`, items };
}

describe("buildSessionTestResults", () => {
  it("returns null when the test doesn't exist", async () => {
    sessionTestFindUnique.mockResolvedValue(null);
    expect(await buildSessionTestResults("missing")).toBeNull();
  });

  it("avgDelta is the mean of PAIRED per-learner deltas, not avgPost - avgPre, when some learners are unpaired", async () => {
    // L1: pre 40, post 80 (delta +40). L2: pre 60, post only (no pre attempt scored... actually give L2 a post only).
    sessionTestFindUnique.mockResolvedValue({
      id: "st1",
      title: "Fractions check-in",
      status: "PUBLISHED",
      session: {
        topic: "Fractions",
        scheduledAt: new Date("2026-09-01T00:00:00Z"),
        status: "COMPLETED",
        class: {
          code: "C-0001",
          subject: "MATH",
          enrollments: [
            { learner: { id: "L1", anonymousId: "STU-0001" } },
            { learner: { id: "L2", anonymousId: "STU-0002" } },
            { learner: { id: "L3", anonymousId: "STU-0003" } }, // never attempted
          ],
        },
      },
      questions: [{ position: 0, question: { prompt: "2+2=?" } }],
      attempts: [
        attempt("L1", "PRE", 40, [{ position: 0, isCorrect: false }]),
        attempt("L1", "POST", 80, [{ position: 0, isCorrect: true }]),
        attempt("L2", "POST", 60, [{ position: 0, isCorrect: true }]), // no PRE — unpaired
      ],
    });

    const r = await buildSessionTestResults("st1");
    expect(r).not.toBeNull();

    // avgPost - avgPre would be (80+60)/2 - 40 = 30, but the correct paired mean is +40 (only L1 is paired).
    expect(r!.totals.avgPre).toBe(40);
    expect(r!.totals.avgPost).toBe(70); // (80+60)/2
    expect(r!.totals.pairedCount).toBe(1);
    expect(r!.totals.avgDelta).toBe(40);
    expect(r!.totals.avgDelta).not.toBe(r!.totals.avgPost! - r!.totals.avgPre!);

    // L3 never attempted — included with nulls, not dropped.
    const l3 = r!.learners.find((l) => l.anonymousId === "STU-0003");
    expect(l3).toEqual({
      anonymousId: "STU-0003",
      preAttemptId: null,
      postAttemptId: null,
      pre: null,
      post: null,
      delta: null,
    });

    // No `id` on any learner row (double-blind).
    expect(r!.learners.every((l) => !("id" in l))).toBe(true);
  });

  it("computes per-question correct rate + deltaRate from the same `position`", async () => {
    sessionTestFindUnique.mockResolvedValue({
      id: "st1",
      title: "t",
      status: "PUBLISHED",
      session: {
        topic: "Fractions",
        scheduledAt: new Date(),
        status: "COMPLETED",
        class: { code: "C-0001", subject: "MATH", enrollments: [{ learner: { id: "L1", anonymousId: "STU-0001" } }] },
      },
      questions: [{ position: 0, question: { prompt: "Q1" } }],
      attempts: [
        attempt("L1", "PRE", 0, [{ position: 0, isCorrect: false }]),
        attempt("L1", "POST", 100, [{ position: 0, isCorrect: true }]),
      ],
    });

    const r = await buildSessionTestResults("st1");
    expect(r!.questions[0]).toEqual({
      position: 0,
      prompt: "Q1",
      pre: { answered: 1, correct: 0, correctRate: 0 },
      post: { answered: 1, correct: 1, correctRate: 100 },
      deltaRate: 100,
    });
  });
});

describe("buildClassSessionTestRollup", () => {
  it("returns null when the class doesn't exist", async () => {
    tutorClassFindUnique.mockResolvedValue(null);
    expect(await buildClassSessionTestRollup("missing")).toBeNull();
  });

  it("a session with no test is a gap (nulls), not a fake zero", async () => {
    tutorClassFindUnique.mockResolvedValue({
      code: "C-0001",
      sessions: [
        { id: "s1", topic: "Fractions", scheduledAt: new Date(), status: "SCHEDULED", test: null },
      ],
    });

    const r = await buildClassSessionTestRollup("c1");
    expect(r!.sessions[0]).toMatchObject({
      sessionTestId: null,
      avgPre: null,
      avgPost: null,
      avgDelta: null,
      pairedCount: 0,
    });
  });

  it("aggregates avgDelta across sessions as the mean of every paired learner's delta", async () => {
    tutorClassFindUnique.mockResolvedValue({
      code: "C-0001",
      sessions: [
        {
          id: "s1",
          topic: "Fractions",
          scheduledAt: new Date(),
          status: "COMPLETED",
          test: {
            id: "st1",
            status: "CLOSED",
            attempts: [
              { learnerId: "L1", kind: "PRE", scorePercent: 40 },
              { learnerId: "L1", kind: "POST", scorePercent: 60 }, // delta +20
            ],
          },
        },
        {
          id: "s2",
          topic: "Decimals",
          scheduledAt: new Date(),
          status: "COMPLETED",
          test: {
            id: "st2",
            status: "CLOSED",
            attempts: [
              { learnerId: "L1", kind: "PRE", scorePercent: 50 },
              { learnerId: "L1", kind: "POST", scorePercent: 90 }, // delta +40
            ],
          },
        },
      ],
    });

    const r = await buildClassSessionTestRollup("c1");
    expect(r!.totals.pairedCount).toBe(2);
    expect(r!.totals.avgDelta).toBe(30); // (20+40)/2
  });
});
