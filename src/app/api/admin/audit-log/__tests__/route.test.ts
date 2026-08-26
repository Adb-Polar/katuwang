import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, auditLogFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  auditLogFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: { findMany: auditLogFindMany },
  },
}));

import { GET } from "@/app/api/admin/audit-log/route";

describe("GET /api/admin/audit-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 when the session user is not an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns audit log entries ordered by newest first", async () => {
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

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });
});
