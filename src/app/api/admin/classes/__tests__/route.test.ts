import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findMany: findManyMock, count: countMock },
  },
}));

import { GET } from "@/app/api/admin/classes/route";

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/admin/classes${query}`);
}

describe("GET /api/admin/classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countMock.mockResolvedValue(0);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 200 with flattened topics/tutor, nextSessionAt, and pagination metadata", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    const upcoming = new Date(Date.now() + 3 * 86_400_000);
    findManyMock.mockResolvedValue([
      {
        id: "c1",
        subject: "MATH",
        topics: [{ id: "t1", classId: "c1", topic: "Algebraic Expressions" }],
        sessions: [
          { id: "s1", status: "COMPLETED", scheduledAt: new Date(Date.now() - 86_400_000) },
          { id: "s2", status: "SCHEDULED", scheduledAt: upcoming },
        ],
        tutorProfile: { user: { id: "t1", anonymousId: "TUT-0001", firstName: "Maria", lastName: "Santos" } },
        _count: { enrollments: 2 },
      },
    ]);
    countMock.mockResolvedValue(1);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.classes).toEqual([
      {
        id: "c1",
        subject: "MATH",
        topics: ["Algebraic Expressions"],
        tutor: { id: "t1", anonymousId: "TUT-0001", firstName: "Maria", lastName: "Santos" },
        _count: { enrollments: 2 },
        nextSessionAt: upcoming.toISOString(),
      },
    ]);
    // The raw sessions array is not leaked to the client.
    expect(json.classes[0]).not.toHaveProperty("sessions");
  });

  it("nextSessionAt is null when a class has no sessions", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([
      {
        id: "c2",
        subject: "SCIENCE",
        topics: [],
        sessions: [],
        tutorProfile: { user: { id: "t2", anonymousId: "TUT-0002", firstName: "A", lastName: "B" } },
        _count: { enrollments: 0 },
      },
    ]);
    countMock.mockResolvedValue(1);
    const json = await (await GET(makeRequest())).json();
    expect(json.classes[0].nextSessionAt).toBeNull();
  });

  it("filters by subject and status when provided", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([]);

    await GET(makeRequest("?subject=MATH&status=SUSPENDED"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ subject: "MATH", status: "SUSPENDED" }),
      })
    );
  });

  it("matches the class code in the q search", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([]);

    await GET(makeRequest("?q=C-0007"));
    const where = findManyMock.mock.calls[0][0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([{ code: { contains: "C-0007" } }])
    );
  });

  it("orders by createdAt since classes no longer have a single scheduledAt", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([]);

    await GET(makeRequest());
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });
});
