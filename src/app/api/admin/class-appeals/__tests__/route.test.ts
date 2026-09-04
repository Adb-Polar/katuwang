import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { classAppeal: { findMany: findManyMock, count: countMock } },
}));

import { GET } from "@/app/api/admin/class-appeals/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const makeReq = (url = "http://localhost/api/admin/class-appeals") => new NextRequest(url, { method: "GET" });

describe("GET /api/admin/class-appeals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("defaults to PENDING and shapes the tutor field", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([
      {
        id: "a1",
        reason: "r",
        status: "PENDING",
        reviewNote: null,
        createdAt: new Date(),
        reviewedAt: null,
        class: { id: "c1", code: "C-0001", subject: "MATH", status: "SUSPENDED", suspendedReason: "x" },
        tutorProfile: { user: { id: "u1", anonymousId: "TUT-0001" } },
      },
    ]);
    countMock.mockResolvedValue(1);

    const res = await GET(makeReq());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PENDING" } }));
    expect(json.appeals[0].tutor).toEqual({ id: "u1", anonymousId: "TUT-0001" });
  });

  it("honours the status query param", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
    await GET(makeReq("http://localhost/api/admin/class-appeals?status=APPROVED"));
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "APPROVED" } }));
  });
});
