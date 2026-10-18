import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  userFindManyMock,
  userFindFirstMock,
  userCreateMock,
  tokenCreateMock,
  auditLogCreateMock,
  sendMailMock,
  generateAnonymousIdMock,
  userCountMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindManyMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  userCreateMock: vi.fn(),
  userCountMock: vi.fn(),
  tokenCreateMock: vi.fn(),
  auditLogCreateMock: vi.fn(),
  sendMailMock: vi.fn(),
  generateAnonymousIdMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: userFindManyMock,
      findFirst: userFindFirstMock,
      create: userCreateMock,
      count: userCountMock,
    },
    passwordResetToken: {
      create: tokenCreateMock,
    },
    auditLog: {
      create: auditLogCreateMock,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        user: { create: userCreateMock },
        passwordResetToken: { create: tokenCreateMock },
        auditLog: { create: auditLogCreateMock },
      }),
  },
}));

vi.mock("@/lib/mail", () => ({
  sendMail: sendMailMock,
}));

vi.mock("@/lib/idGenerator", () => ({
  generateAnonymousId: generateAnonymousIdMock,
}));

import { GET, POST } from "@/app/api/admin/admins/route";

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/admins", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/admin/admins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as a standard ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 when authenticated as STUDENT_TUTOR", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "tutor-1", role: "STUDENT_TUTOR" },
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 200 with admin list when authenticated as SUPER_ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    const mockAdmins = [
      {
        id: "super-1",
        anonymousId: "ADM-0001",
        firstName: "Super",
        lastName: "Admin",
        email: "superadmin@katuwang.test",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      {
        id: "admin-2",
        anonymousId: "ADM-0002",
        firstName: "Jane",
        lastName: "Doe",
        email: "admin2@katuwang.test",
        role: "ADMIN",
        status: "ACTIVE",
      },
    ];
    userFindManyMock.mockResolvedValue(mockAdmins);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.admins).toHaveLength(2);
    expect(json.admins[0].role).toBe("SUPER_ADMIN");
  });
});

describe("POST /api/admin/admins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(
      makePostRequest({
        firstName: "Test",
        lastName: "Admin",
        email: "test@example.com",
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as standard ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    const res = await POST(
      makePostRequest({
        firstName: "Test",
        lastName: "Admin",
        email: "test@example.com",
      })
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when validation fails (invalid email)", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    const res = await POST(
      makePostRequest({
        firstName: "Test",
        lastName: "Admin",
        email: "invalid-email",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    userFindFirstMock.mockResolvedValue({ id: "existing-user-id" });

    const res = await POST(
      makePostRequest({
        firstName: "Existing",
        lastName: "User",
        email: "exists@example.com",
      })
    );
    expect(res.status).toBe(409);
  });

  it("successfully creates an ADMIN account when authenticated as SUPER_ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    userFindFirstMock.mockResolvedValue(null);
    generateAnonymousIdMock.mockResolvedValue("ADM-0003");

    const createdUser = {
      id: "new-admin-id",
      anonymousId: "ADM-0003",
      firstName: "New",
      lastName: "Admin",
      email: "newadmin@example.com",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date(),
    };
    userCreateMock.mockResolvedValue(createdUser);
    tokenCreateMock.mockResolvedValue({ id: "token-id" });
    auditLogCreateMock.mockResolvedValue({ id: "audit-id" });
    sendMailMock.mockResolvedValue(true);

    const res = await POST(
      makePostRequest({
        firstName: "New",
        lastName: "Admin",
        email: "newadmin@example.com",
        contactInfo: "09123456789",
      })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.admin.anonymousId).toBe("ADM-0003");
    expect(json.admin.role).toBe("ADMIN");
    expect(json.activationUrl).toBeDefined();

    // Verify user was created with role ADMIN (never SUPER_ADMIN)
    expect(userCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "ADMIN",
          anonymousId: "ADM-0003",
          email: "newadmin@example.com",
        }),
      })
    );

    // Verify audit log creation
    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "super-1",
          action: "ADMIN_CREATED",
          targetType: "USER",
          targetId: "new-admin-id",
        }),
      })
    );
  });
});
