import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  userFindUniqueMock,
  userUpdateMock,
  auditLogCreateMock,
  notificationCreateMock,
  transactionMock,
  deleteFilesMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  userUpdateMock: vi.fn(),
  auditLogCreateMock: vi.fn(),
  notificationCreateMock: vi.fn(),
  transactionMock: vi.fn(),
  deleteFilesMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock, update: userUpdateMock },
    auditLog: { create: auditLogCreateMock },
    notification: { create: notificationCreateMock },
    $transaction: transactionMock,
  },
}));

vi.mock("uploadthing/server", () => {
  class UTApi {
    deleteFiles = deleteFilesMock;
  }
  return {
    UTApi,
    UploadThingError: class extends Error {},
  };
});

import { POST } from "@/app/api/admin/users/[userId]/avatar-action/route";

function makeRequest(userId: string, body: unknown) {
  return {
    req: new NextRequest(`http://localhost/api/admin/users/${userId}/avatar-action`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    params: Promise.resolve({ userId }),
  };
}

describe("POST /api/admin/users/[userId]/avatar-action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (cb) =>
      cb({
        user: { update: userUpdateMock },
        auditLog: { create: auditLogCreateMock },
        notification: { create: notificationCreateMock },
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { req, params } = makeRequest("u1", { action: "WARN", reason: "Policy violation" });
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 401 when user is not ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const { req, params } = makeRequest("u2", { action: "WARN", reason: "Policy violation" });
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when target user is not found", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUniqueMock.mockResolvedValue(null);
    const { req, params } = makeRequest("u2", { action: "WARN", reason: "Policy violation" });
    const res = await POST(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 400 when attempting to moderate an admin user", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUniqueMock.mockResolvedValue({ id: "admin2", role: "ADMIN" });
    const { req, params } = makeRequest("admin2", { action: "WARN", reason: "Policy violation" });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("admin");
  });

  it("returns 400 when action is WARN but reason is missing or empty", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUniqueMock.mockResolvedValue({ id: "u2", role: "STUDENT_LEARNER" });
    const { req, params } = makeRequest("u2", { action: "WARN", reason: "   " });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("warning reason is required");
  });

  it("successfully sends warning notification and logs audit trail", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUniqueMock.mockResolvedValue({ id: "u2", role: "STUDENT_LEARNER" });
    const { req, params } = makeRequest("u2", { action: "WARN", reason: "Inappropriate photo" });

    const res = await POST(req, { params });
    expect(res.status).toBe(200);

    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "admin1",
          action: "PROFILE_PICTURE_WARNING",
          targetId: "u2",
          reason: "Inappropriate photo",
        }),
      })
    );
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u2",
          type: "PROFILE_PICTURE_WARNING",
          message: expect.stringContaining("Inappropriate photo"),
        }),
      })
    );
  });

  it("successfully removes picture, triggers cloud deletion, and logs audit trail", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUniqueMock.mockResolvedValue({
      id: "u2",
      role: "STUDENT_TUTOR",
      image: "https://utfs.io/f/pic.jpg",
      imageKey: "key_789",
      profilePictureLocked: false,
    });
    deleteFilesMock.mockResolvedValue({ success: true });
    userUpdateMock.mockResolvedValue({
      id: "u2",
      role: "STUDENT_TUTOR",
      image: null,
      imageKey: null,
      profilePictureLocked: false,
    });

    const { req, params } = makeRequest("u2", { action: "REMOVE", reason: "Violates guidelines" });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);

    expect(deleteFilesMock).toHaveBeenCalledWith("key_789");
    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u2" },
        data: expect.objectContaining({
          image: null,
          imageKey: null,
        }),
      })
    );
    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "admin1",
          action: "PROFILE_PICTURE_REMOVED",
          targetId: "u2",
        }),
      })
    );
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u2",
          type: "PROFILE_PICTURE_REMOVED",
        }),
      })
    );
  });

  it("successfully locks profile picture editing", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUniqueMock.mockResolvedValue({
      id: "u2",
      role: "STUDENT_LEARNER",
      image: null,
      imageKey: null,
      profilePictureLocked: false,
    });
    userUpdateMock.mockResolvedValue({
      id: "u2",
      role: "STUDENT_LEARNER",
      image: null,
      imageKey: null,
      profilePictureLocked: true,
    });

    const { req, params } = makeRequest("u2", { action: "LOCK", reason: "Repeated violations" });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);

    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u2" },
        data: expect.objectContaining({
          profilePictureLocked: true,
        }),
      })
    );
    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "PROFILE_PICTURE_LOCKED",
        }),
      })
    );
  });

  it("successfully unlocks profile picture editing", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userFindUniqueMock.mockResolvedValue({
      id: "u2",
      role: "STUDENT_LEARNER",
      image: null,
      imageKey: null,
      profilePictureLocked: true,
    });
    userUpdateMock.mockResolvedValue({
      id: "u2",
      role: "STUDENT_LEARNER",
      image: null,
      imageKey: null,
      profilePictureLocked: false,
    });

    const { req, params } = makeRequest("u2", { action: "UNLOCK" });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);

    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u2" },
        data: expect.objectContaining({
          profilePictureLocked: false,
        }),
      })
    );
    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "PROFILE_PICTURE_UNLOCKED",
        }),
      })
    );
  });
});
