import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  userFindFirstMock,
  userUpdateMock,
  auditLogCreateMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  userUpdateMock: vi.fn(),
  auditLogCreateMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: userFindFirstMock,
      update: userUpdateMock,
    },
    auditLog: {
      create: auditLogCreateMock,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        user: { update: userUpdateMock },
        auditLog: { create: auditLogCreateMock },
      }),
  },
}));

import { GET, PATCH } from "@/app/api/admin/admins/[adminId]/route";

function makeGetRequest(adminId = "admin-1") {
  return new NextRequest(`http://localhost/api/admin/admins/${adminId}`);
}

function makePatchRequest(body: unknown, adminId = "admin-2") {
  return new NextRequest(`http://localhost/api/admin/admins/${adminId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/admin/admins/[adminId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeGetRequest("admin-1"), {
      params: Promise.resolve({ adminId: "admin-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when session is not SUPER_ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    const res = await GET(makeGetRequest("admin-2"), {
      params: Promise.resolve({ adminId: "admin-2" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when target admin is not found", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    userFindFirstMock.mockResolvedValue(null);
    const res = await GET(makeGetRequest("nonexistent"), {
      params: Promise.resolve({ adminId: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 with admin details for SUPER_ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    userFindFirstMock.mockResolvedValue({
      id: "admin-2",
      anonymousId: "ADM-0002",
      role: "ADMIN",
      email: "admin2@katuwang.test",
    });
    const res = await GET(makeGetRequest("admin-2"), {
      params: Promise.resolve({ adminId: "admin-2" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.admin.id).toBe("admin-2");
  });
});

describe("PATCH /api/admin/admins/[adminId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await PATCH(
      makePatchRequest({ status: "SUSPENDED" }, "admin-2"),
      { params: Promise.resolve({ adminId: "admin-2" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when session is not SUPER_ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    const res = await PATCH(
      makePatchRequest({ status: "SUSPENDED" }, "admin-2"),
      { params: Promise.resolve({ adminId: "admin-2" }) }
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when Super Admin attempts self-suspension", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    const res = await PATCH(
      makePatchRequest({ status: "SUSPENDED" }, "super-1"),
      { params: Promise.resolve({ adminId: "super-1" }) }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("cannot suspend or modify your own");
  });

  it("returns 404 when target admin is not found", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    userFindFirstMock.mockResolvedValue(null);
    const res = await PATCH(
      makePatchRequest({ status: "SUSPENDED" }, "missing-id"),
      { params: Promise.resolve({ adminId: "missing-id" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when trying to modify another SUPER_ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    userFindFirstMock.mockResolvedValue({
      id: "super-2",
      role: "SUPER_ADMIN",
    });
    const res = await PATCH(
      makePatchRequest({ status: "SUSPENDED" }, "super-2"),
      { params: Promise.resolve({ adminId: "super-2" }) }
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Cannot modify a Super Admin account");
  });

  it("returns 400 when invalid status is provided", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    const res = await PATCH(
      makePatchRequest({ status: "BANNED" }, "admin-2"),
      { params: Promise.resolve({ adminId: "admin-2" }) }
    );
    expect(res.status).toBe(400);
  });

  it("successfully updates an ADMIN status and writes an audit log", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    userFindFirstMock.mockResolvedValue({
      id: "admin-2",
      role: "ADMIN",
      anonymousId: "ADM-0002",
      status: "ACTIVE",
    });
    userUpdateMock.mockResolvedValue({
      id: "admin-2",
      role: "ADMIN",
      anonymousId: "ADM-0002",
      status: "SUSPENDED",
      statusReason: "Policy violation",
    });
    auditLogCreateMock.mockResolvedValue({ id: "audit-log-1" });

    const res = await PATCH(
      makePatchRequest(
        { status: "SUSPENDED", reason: "Policy violation" },
        "admin-2"
      ),
      { params: Promise.resolve({ adminId: "admin-2" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.admin.status).toBe("SUSPENDED");

    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "admin-2" },
        data: expect.objectContaining({
          status: "SUSPENDED",
          statusReason: "Policy violation",
        }),
      })
    );

    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "super-1",
          action: "ADMIN_STATUS_CHANGE",
          targetType: "USER",
          targetId: "admin-2",
        }),
      })
    );
  });
});
