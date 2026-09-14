import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findUniqueMock, updateMock, bcryptCompareMock, bcryptHashMock } = vi.hoisted(
  () => ({
    getServerSessionMock: vi.fn(),
    findUniqueMock: vi.fn(),
    updateMock: vi.fn(),
    bcryptCompareMock: vi.fn(),
    bcryptHashMock: vi.fn().mockResolvedValue("new-hashed-pw"),
  })
);

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock, update: updateMock },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: bcryptCompareMock, hash: bcryptHashMock },
}));

import { POST } from "@/app/api/admin/profile/password/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/profile/password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/admin/profile/password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ currentPassword: "old12345", newPassword: "newpassword1" }));
    expect(res.status).toBe(401);
  });

  it("401 when the session role is not ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await POST(makeRequest({ currentPassword: "old12345", newPassword: "newpassword1" }));
    expect(res.status).toBe(401);
  });

  it("400 on invalid body", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "ADMIN" } });
    const res = await POST(makeRequest({ currentPassword: "", newPassword: "short" }));
    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("401 when the current password is wrong", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "ADMIN" } });
    findUniqueMock.mockResolvedValue({ password: "hashed" });
    bcryptCompareMock.mockResolvedValue(false);

    const res = await POST(makeRequest({ currentPassword: "wrong1234", newPassword: "newpassword1" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/incorrect/i);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates the password hash on success", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "ADMIN" } });
    findUniqueMock.mockResolvedValue({ password: "hashed" });
    bcryptCompareMock.mockResolvedValue(true);

    const res = await POST(makeRequest({ currentPassword: "old12345", newPassword: "newpassword1" }));
    expect(res.status).toBe(200);
    expect(bcryptHashMock).toHaveBeenCalledWith("newpassword1", 12);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "U1" },
      data: { password: "new-hashed-pw" },
    });
  });

  it("500 when the update throws", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "ADMIN" } });
    findUniqueMock.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ currentPassword: "old12345", newPassword: "newpassword1" }));
    expect(res.status).toBe(500);
  });
});
