import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, classFindUnique, classUpdate, auditLogCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classFindUnique: vi.fn(),
  classUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findUnique: classFindUnique, update: classUpdate },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ tutorClass: { update: classUpdate }, auditLog: { create: auditLogCreate } }),
  },
}));

import { PATCH } from "@/app/api/admin/classes/[classId]/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/classes/c1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patch(body: unknown, classId = "c1") {
  return PATCH(makeRequest(body), { params: Promise.resolve({ classId }) });
}

describe("PATCH /api/admin/classes/[classId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the class doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue(null);
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when suspending a non-scheduled class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "COMPLETED" });
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(400);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when reinstating a non-suspended class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(400);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("suspends a scheduled class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SUSPENDED", suspendedReason: "Policy violation" });

    const res = await patch({ status: "SUSPENDED", reason: "Policy violation" });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { status: "SUSPENDED", suspendedReason: "Policy violation", suspendedUntil: null },
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "admin1",
          action: "CLASS_STATUS_CHANGE",
          targetType: "CLASS",
          targetId: "c1",
          reason: "Policy violation",
        }),
      })
    );
  });

  it("reinstates a suspended class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SUSPENDED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SCHEDULED", suspendedReason: null });

    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { status: "SCHEDULED", suspendedReason: null, suspendedUntil: null },
      })
    );
  });

  it("computes suspendedUntil from durationDays when suspending", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SUSPENDED" });

    const before = Date.now();
    await patch({ status: "SUSPENDED", durationDays: 5 });
    const call = classUpdate.mock.calls[0][0];
    const suspendedUntil = call.data.suspendedUntil as Date;

    expect(suspendedUntil).toBeInstanceOf(Date);
    expect(suspendedUntil.getTime()).toBeGreaterThanOrEqual(before + 5 * 24 * 60 * 60 * 1000 - 1000);
  });

  it("returns 400 when banning a completed class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "COMPLETED" });
    const res = await patch({ status: "BANNED" });
    expect(res.status).toBe(400);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("bans a scheduled class permanently (no expiry)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "BANNED", suspendedReason: "Severe violation" });

    const res = await patch({ status: "BANNED", reason: "Severe violation" });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { status: "BANNED", suspendedReason: "Severe violation", suspendedUntil: null },
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "CLASS_STATUS_CHANGE", reason: "Severe violation" }),
      })
    );
  });

  it("bans an already-suspended class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SUSPENDED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "BANNED" });

    const res = await patch({ status: "BANNED" });
    expect(res.status).toBe(200);
  });

  it("reinstates a banned class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "BANNED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SCHEDULED" });

    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "SCHEDULED", suspendedReason: null, suspendedUntil: null },
      })
    );
  });

  it("ignores durationDays when banning", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "BANNED" });

    await patch({ status: "BANNED", durationDays: 10 });
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ suspendedUntil: null }) })
    );
  });
});
