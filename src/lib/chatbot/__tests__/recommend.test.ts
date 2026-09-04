import { describe, it, expect, vi, beforeEach } from "vitest";

const { findManyMock, settingMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  settingMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { tutorClass: { findMany: findManyMock } } }));
vi.mock("@/lib/settings", () => ({ getSetting: settingMock }));

import { extractCriteria, recommendClasses } from "@/lib/chatbot/recommend";
import type { ChatContext } from "@/lib/chatbot/types";

const learner: ChatContext = { role: "STUDENT_LEARNER", userId: "L1", gradeLevel: "GRADE_9" };

// Row shaped like learnerClassInclude's payload.
function classRow(over: Record<string, unknown> = {}) {
  return {
    id: "c1",
    code: "C-0001",
    subject: "MATH",
    gradeLevel: "GRADE_9",
    status: "SCHEDULED",
    published: true,
    maxStudents: 3,
    createdAt: new Date("2026-08-01"),
    suspendedReason: null,
    suspendedUntil: null,
    topics: [{ topic: "Algebraic Expressions" }],
    sessions: [
      { scheduledAt: new Date(Date.now() + 3 * 864e5), duration: 60, status: "SCHEDULED" },
    ],
    _count: { enrollments: 0 },
    enrollments: [],
    tutorProfile: {
      id: "tp1",
      user: { id: "u1", anonymousId: "TUT-0001", firstName: "A", lastName: "B", section: "X" },
      topicCertifications: [{ subject: "MATH", topic: "Algebraic Expressions" }],
    },
    ...over,
  };
}

describe("extractCriteria", () => {
  it("detects the subject from keywords", () => {
    expect(extractCriteria("recommend a math class").subject).toBe("MATH");
    expect(extractCriteria("I need help with biology").subject).toBe("SCIENCE");
    expect(extractCriteria("hello there").subject).toBeNull();
  });

  it("detects a named topic within the subject", () => {
    const c = extractCriteria("help me with algebraic expressions");
    expect(c.subject).toBe("MATH");
    expect(c.topics).toContain("Algebraic Expressions");
  });
});

describe("recommendClasses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingMock.mockResolvedValue(false);
  });

  it("ranks matching classes when a topic is named", async () => {
    findManyMock.mockResolvedValue([classRow()]);
    const res = await recommendClasses(learner, { subject: "MATH", topics: ["Algebraic Expressions"] });
    expect(res.cards).toHaveLength(1);
    expect(res.cards[0].href).toBe("/learner/classes/c1");
    expect(res.fallbackToRequest).toBe(false);
  });

  it("falls back to open classes when no topic is named", async () => {
    findManyMock.mockResolvedValue([classRow()]);
    const res = await recommendClasses(learner, { subject: "MATH", topics: [] });
    expect(res.cards).toHaveLength(1);
    expect(res.cards[0].score).toBe(0);
  });

  it("flags fallbackToRequest when nothing is available", async () => {
    findManyMock.mockResolvedValue([]);
    const res = await recommendClasses(learner, { subject: "MATH", topics: ["Algebraic Expressions"] });
    expect(res.cards).toHaveLength(0);
    expect(res.fallbackToRequest).toBe(true);
  });

  it("returns nothing when no subject could be extracted", async () => {
    const res = await recommendClasses(learner, { subject: null, topics: [] });
    expect(res.fallbackToRequest).toBe(true);
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
