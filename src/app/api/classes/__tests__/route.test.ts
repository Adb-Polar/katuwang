import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock, updateManyMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  updateManyMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: {
      findMany: findManyMock,
      count: countMock,
      updateMany: updateManyMock,
    },
  },
}));

import { GET } from "@/app/api/classes/route";

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/classes${query}`);
}

const learner = { user: { id: "u1", role: "STUDENT_LEARNER" } };

describe("GET /api/classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 0 });
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("paginates the browse scope by default and returns both tab counts", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    countMock.mockResolvedValueOnce(30).mockResolvedValueOnce(4); // browse, mine
    findManyMock.mockResolvedValue([
      {
        id: "c1",
        subject: "MATH",
        gradeLevel: null,
        status: "SCHEDULED",
        published: true,
        maxStudents: 2,
        topics: [{ topic: "Fractions & Decimals" }],
        sessions: [{ id: "s1", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3600_000), duration: 60 }],
        tutorProfile: {
          id: "tp1",
          user: { id: "t1", anonymousId: "TUT-0001" },
          topicCertifications: [{ subject: "MATH", topic: "Fractions & Decimals" }],
        },
        _count: { enrollments: 0 },
        enrollments: [],
      },
    ]);

    const res = await GET(makeRequest("?page=2&pageSize=12"));
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.page).toBe(2);
    expect(json.pageSize).toBe(12);
    expect(json.total).toBe(30);
    expect(json.counts).toEqual({ browse: 30, mine: 4 });
    expect(json.classes[0]).toMatchObject({
      id: "c1",
      topics: ["Fractions & Decimals"],
      verifiedTopics: ["Fractions & Decimals"],
      tutor: { id: "t1", anonymousId: "TUT-0001" },
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "SCHEDULED",
          published: true,
          sessions: { some: { status: "SCHEDULED", scheduledAt: { gt: expect.any(Date) } } },
          enrollments: { none: { learnerId: "u1" } },
        },
        skip: 12,
        take: 12,
      })
    );
    expect(updateManyMock).toHaveBeenCalled(); // reinstateExpiredClasses
  });

  it("queries the enrolled classes for scope=mine", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await GET(makeRequest("?scope=mine"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { enrollments: { some: { learnerId: "u1" } } }, skip: 0 })
    );
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findManyMock.mockRejectedValue(new Error("DB down"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/unexpected error/i);
  });
});
