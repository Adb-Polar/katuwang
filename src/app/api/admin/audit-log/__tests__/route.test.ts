import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, auditLogFindMany, auditLogCount, auditLogGroupBy } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  auditLogFindMany: vi.fn(),
  auditLogCount: vi.fn(),
  auditLogGroupBy: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: { findMany: auditLogFindMany, count: auditLogCount, groupBy: auditLogGroupBy },
  },
}));

import { GET } from "@/app/api/admin/audit-log/route";

const makeRequest = (query = "") => new NextRequest(`http://localhost/api/admin/audit-log${query}`);

describe("GET /api/admin/audit-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditLogCount.mockResolvedValue(1);
    auditLogGroupBy.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when the session user is not an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns a paginated payload ordered by newest first by default", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    auditLogFindMany.mockResolvedValue([
      {
        id: "a1",
        action: "USER_STATUS_CHANGE",
        targetType: "USER",
        targetId: "u1",
        reason: "Reported by learner",
        createdAt: new Date().toISOString(),
        admin: { anonymousId: "ADM-0001", firstName: "Ana", lastName: "Reyes" },
      },
    ]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.logs).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });

  it("applies action / targetType / q filters and a sortable column", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    auditLogFindMany.mockResolvedValue([]);

    await GET(makeRequest("?action=CLASS_STATUS_CHANGE&targetType=CLASS&q=spam&sort=action&dir=asc"));

    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          action: "CLASS_STATUS_CHANGE",
          targetType: "CLASS",
          OR: [
            { reason: { contains: "spam" } },
            { targetId: { contains: "spam" } },
            { admin: { anonymousId: { contains: "spam" } } },
          ],
        },
        orderBy: { action: "asc" },
      })
    );
  });

  it("ignores an unknown sort column, falling back to createdAt", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    auditLogFindMany.mockResolvedValue([]);

    await GET(makeRequest("?sort=reason"));

    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });
});
