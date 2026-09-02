import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, userFindUnique, userUpdate, auditLogCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUnique, update: userUpdate },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ user: { update: userUpdate }, auditLog: { create: auditLogCreate } }),
  },
}));

import { PATCH } from "@/app/api/admin/users/[userId]/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/users/u1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patch(body: unknown, userId = "u1") {
  return PATCH(makeRequest(body), { params: Promise.resolve({ userId }) });
}

describe("PATCH /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the user doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUnique.mockResolvedValue(null);
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when targeting an admin account", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUnique.mockResolvedValue({ id: "u1", role: "ADMIN" });
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid status", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUnique.mockResolvedValue({ id: "u1", role: "STUDENT_TUTOR" });
    const res = await patch({ status: "NOT_A_STATUS" });
    expect(res.status).toBe(400);
  });

  it("updates the account status successfully", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUnique.mockResolvedValue({ id: "u1", role: "STUDENT_TUTOR" });
    userUpdate.mockResolvedValue({
      id: "u1",
      anonymousId: "TUT-0001",
      status: "SUSPENDED",
      statusReason: "Reported by learner",
      statusUpdatedAt: new Date().toISOString(),
    });

    const res = await patch({ status: "SUSPENDED", reason: "Reported by learner" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("SUSPENDED");
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ status: "SUSPENDED", statusReason: "Reported by learner" }),
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "admin1",
          action: "USER_STATUS_CHANGE",
          targetType: "USER",
          targetId: "u1",
          reason: "Reported by learner",
        }),
      })
    );
  });

  it("computes statusExpiresAt from durationDays when suspending", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUnique.mockResolvedValue({ id: "u1", role: "STUDENT_TUTOR" });
    userUpdate.mockResolvedValue({ id: "u1", status: "SUSPENDED" });

    const before = Date.now();
    await patch({ status: "SUSPENDED", durationDays: 5 });
    const call = userUpdate.mock.calls[0][0];
    const expiresAt = call.data.statusExpiresAt as Date;

    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 5 * 24 * 60 * 60 * 1000 - 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(before + 5 * 24 * 60 * 60 * 1000 + 5000);
  });

  it("leaves statusExpiresAt null for an indefinite suspension", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUnique.mockResolvedValue({ id: "u1", role: "STUDENT_TUTOR" });
    userUpdate.mockResolvedValue({ id: "u1", status: "SUSPENDED" });

    await patch({ status: "SUSPENDED" });
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ statusExpiresAt: null }) })
    );
  });

  it("clears statusExpiresAt when banning", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUnique.mockResolvedValue({ id: "u1", role: "STUDENT_TUTOR" });
    userUpdate.mockResolvedValue({ id: "u1", status: "BANNED" });

    await patch({ status: "BANNED", durationDays: 5 });
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ statusExpiresAt: null }) })
    );
  });
});
