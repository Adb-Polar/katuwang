import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { topicRequest: { findMany: findManyMock, count: countMock } },
}));

import { GET } from "@/app/api/admin/topic-requests/route";

const admin = { user: { id: "A1", role: "ADMIN" } };

function req(url = "http://localhost/api/admin/topic-requests") {
  return new NextRequest(url);
}

describe("GET /api/admin/topic-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);
  });

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    expect((await GET(req())).status).toBe(401);
  });

  it("filters by status, subject, and scope", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    await GET(req("http://localhost/api/admin/topic-requests?status=OPEN&subject=MATH&scope=directed"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "OPEN",
          subject: "MATH",
          directedTutorProfileId: { not: null },
        }),
      })
    );
  });

  it("filters by scope=public", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    await GET(req("http://localhost/api/admin/topic-requests?scope=public"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ directedTutorProfileId: null }) })
    );
  });

  it("returns the anonymized + real-name learner view", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([
      {
        id: "r1",
        subject: "MATH",
        gradeLevel: "GRADE_9",
        note: null,
        status: "OPEN",
        createdAt: new Date(),
        topics: [{ topic: "Algebraic Expressions" }],
        learner: { id: "L1", anonymousId: "STU-0001", firstName: "Juan", lastName: "Dela Cruz" },
        directedTutor: null,
        fulfilledClass: null,
      },
    ]);
    const res = await GET(req());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.requests[0].learner).toEqual({
      id: "L1",
      anonymousId: "STU-0001",
      firstName: "Juan",
      lastName: "Dela Cruz",
    });
  });
});
