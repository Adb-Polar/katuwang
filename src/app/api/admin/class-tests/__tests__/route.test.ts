import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { classTest: { findMany: findManyMock, count: countMock } },
}));

import { GET } from "@/app/api/admin/class-tests/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const request = (url = "http://localhost/api/admin/class-tests") => new NextRequest(url, { method: "GET" });

describe("GET /api/admin/class-tests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("lists tests with class + tutor context", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([
      {
        id: "t1",
        kind: "PRE",
        title: "Pre",
        status: "PUBLISHED",
        class: {
          code: "C-0001",
          subject: "MATH",
          tutorProfile: { user: { id: "u", anonymousId: "TUT-0001" } },
        },
        _count: { questions: 5, attempts: 2 },
      },
    ]);
    countMock.mockResolvedValue(1);

    const res = await GET(request());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.tests[0]).toMatchObject({
      classCode: "C-0001",
      tutor: { anonymousId: "TUT-0001" },
      questionCount: 5,
      attemptCount: 2,
    });
  });

  it("applies the kind + status filters", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
    await GET(request("http://localhost/api/admin/class-tests?kind=POST&status=CLOSED"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ kind: "POST", status: "CLOSED" }) })
    );
  });
});
