import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, findManyMock, updateManyMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  updateManyMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: {
      findMany: findManyMock,
      updateMany: updateManyMock,
    },
  },
}));

import { GET } from "@/app/api/classes/route";

describe("GET /api/classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 0 });
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });

    const res = await GET();
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns 200 with browsable + enrolled classes using the OR where-clause", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    findManyMock.mockResolvedValue([
      {
        id: "c1",
        subject: "MATH",
        topics: [{ id: "t1", classId: "c1", topic: "Fractions & Decimals" }],
        tutorProfile: {
          id: "tp1",
          user: { id: "t1", anonymousId: "TUT-0001" },
          topicCertifications: [{ subject: "MATH", topic: "Fractions & Decimals" }],
        },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([
      {
        id: "c1",
        subject: "MATH",
        topics: ["Fractions & Decimals"],
        verifiedTopics: ["Fractions & Decimals"],
        tutor: { id: "t1", anonymousId: "TUT-0001" },
      },
    ]);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { status: "SCHEDULED", scheduledAt: { gt: expect.any(Date) } },
            { enrollments: { some: { learnerId: "u1" } } },
          ],
        },
      })
    );
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "SCHEDULED", suspendedReason: null, suspendedUntil: null } })
    );
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    findManyMock.mockRejectedValue(new Error("DB down"));

    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/unexpected error/i);
  });
});
