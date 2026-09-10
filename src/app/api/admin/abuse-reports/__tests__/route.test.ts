import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, reportFindMany, reportCount } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  reportFindMany: vi.fn(),
  reportCount: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { report: { findMany: reportFindMany, count: reportCount } },
}));

import { GET } from "@/app/api/admin/abuse-reports/route";

const admin = { user: { id: "A1", role: "ADMIN" } };

function req(url = "http://localhost/api/admin/abuse-reports") {
  return new NextRequest(url);
}

describe("GET /api/admin/abuse-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportFindMany.mockResolvedValue([
      {
        id: "r1",
        targetType: "TUTOR",
        status: "PENDING",
        details: null,
        resolutionNote: null,
        createdAt: new Date(),
        reviewedAt: null,
        violations: [{ type: "NO_SHOW_OR_ABSENCE" }],
        reporter: { anonymousId: "STU-0003" },
        class: null,
        reportedTutorProfile: { user: { id: "u1", anonymousId: "TUT-0007" } },
      },
    ]);
    reportCount.mockResolvedValue(1);
  });

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("defaults to the PENDING tab and returns a paginated envelope", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDING" } })
    );
    const body = await res.json();
    expect(body).toMatchObject({ total: 1, page: 1, pageSize: 10 });
    expect(body.reports[0].violations).toEqual(["NO_SHOW_OR_ABSENCE"]);
    expect(body.reports[0].tutor).toEqual({ id: "u1", anonymousId: "TUT-0007" });
  });

  it("filters by the requested status", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    await GET(req("http://localhost/api/admin/abuse-reports?status=DISMISSED"));
    expect(reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "DISMISSED" } })
    );
  });

  it("filters by target type when given", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    await GET(req("http://localhost/api/admin/abuse-reports?targetType=CLASS"));
    expect(reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDING", targetType: "CLASS" } })
    );
  });

  it("ignores an unknown target type", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    await GET(req("http://localhost/api/admin/abuse-reports?targetType=BOGUS"));
    expect(reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDING" } })
    );
  });
});
