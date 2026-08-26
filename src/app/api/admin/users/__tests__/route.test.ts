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
    user: { findMany: findManyMock, count: countMock },
  },
}));

import { GET } from "@/app/api/admin/users/route";

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/admin/users${query}`);
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countMock.mockResolvedValue(0);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns 401 for a non-admin role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 200 excluding admin accounts by default", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([
      { id: "u1", anonymousId: "STU-0001", role: "STUDENT_LEARNER", status: "ACTIVE" },
    ]);
    countMock.mockResolvedValue(1);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ role: { not: "ADMIN" } }) })
    );
  });

  it("filters by role and search term when provided", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([]);

    await GET(makeRequest("?role=STUDENT_TUTOR&q=maria"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "STUDENT_TUTOR",
          OR: expect.arrayContaining([{ firstName: { contains: "maria" } }]),
        }),
      })
    );
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    findManyMock.mockRejectedValue(new Error("DB down"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
