import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: findManyMock, count: countMock } },
}));

import { GET } from "@/app/api/admin/registrations/route";

const admin = { user: { id: "A1", role: "ADMIN" } };

function makeRequest(url = "http://localhost/api/admin/registrations") {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/registrations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("lists PENDING accounts, oldest first", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([
      { id: "U1", anonymousId: "STU-0005", firstName: "A", lastName: "B", email: "a@x.com", role: "STUDENT_LEARNER", gradeLevel: "GRADE_9", section: "Rizal", createdAt: new Date() },
    ]);
    countMock.mockResolvedValue(1);

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.users).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PENDING", role: { not: "ADMIN" } }),
        orderBy: { createdAt: "asc" },
      })
    );
  });

  it("applies the q search filter", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await GET(makeRequest("http://localhost/api/admin/registrations?q=STU-0007"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          OR: expect.arrayContaining([{ anonymousId: { contains: "STU-0007" } }]),
        }),
      })
    );
  });

  it("500 when the query throws", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockRejectedValue(new Error("db down"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
