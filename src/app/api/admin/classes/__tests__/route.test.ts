import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, findManyMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findMany: findManyMock },
  },
}));

import { GET } from "@/app/api/admin/classes/route";

describe("GET /api/admin/classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with flattened topics/tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([
      {
        id: "c1",
        subject: "MATH",
        topics: [{ id: "t1", classId: "c1", topic: "Algebraic Expressions" }],
        tutorProfile: { user: { id: "t1", anonymousId: "TUT-0001", firstName: "Maria", lastName: "Santos" } },
        _count: { enrollments: 2 },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([
      {
        id: "c1",
        subject: "MATH",
        topics: ["Algebraic Expressions"],
        tutor: { id: "t1", anonymousId: "TUT-0001", firstName: "Maria", lastName: "Santos" },
        _count: { enrollments: 2 },
      },
    ]);
  });
});
