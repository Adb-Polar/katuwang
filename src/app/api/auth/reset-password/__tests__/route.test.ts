import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { findUniqueMock, userUpdateMock, tokenUpdateMock, transactionMock, bcryptHashMock } =
  vi.hoisted(() => ({
    findUniqueMock: vi.fn(),
    userUpdateMock: vi.fn(),
    tokenUpdateMock: vi.fn(),
    transactionMock: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    bcryptHashMock: vi.fn(async () => "hashed-pw"),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: { findUnique: findUniqueMock, update: tokenUpdateMock },
    user: { update: userUpdateMock },
    $transaction: transactionMock,
  },
}));
vi.mock("bcryptjs", () => ({ default: { hash: bcryptHashMock } }));

import { POST } from "@/app/api/auth/reset-password/route";

const INVALID_MSG = "This reset link is invalid or has expired.";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 when the new password is too short", async () => {
    const res = await POST(makeRequest({ token: "abc", password: "short" }));
    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("400 when the token does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ token: "nope", password: "longenough" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(INVALID_MSG);
  });

  it("400 when the token was already used", async () => {
    findUniqueMock.mockResolvedValue({
      id: "T1",
      userId: "U1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 10_000),
    });
    const res = await POST(makeRequest({ token: "used", password: "longenough" }));
    expect(res.status).toBe(400);
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("400 when the token has expired", async () => {
    findUniqueMock.mockResolvedValue({
      id: "T1",
      userId: "U1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1),
    });
    const res = await POST(makeRequest({ token: "old", password: "longenough" }));
    expect(res.status).toBe(400);
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("hashes the new password and burns the token on success", async () => {
    findUniqueMock.mockResolvedValue({
      id: "T1",
      userId: "U1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const res = await POST(makeRequest({ token: "good", password: "longenough" }));

    expect(res.status).toBe(200);
    expect(bcryptHashMock).toHaveBeenCalledWith("longenough", 12);
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "U1" },
      data: { password: "hashed-pw" },
    });
    expect(tokenUpdateMock).toHaveBeenCalledWith({
      where: { id: "T1" },
      data: expect.objectContaining({ usedAt: expect.any(Date) }),
    });
  });

  it("500 when the update throws", async () => {
    findUniqueMock.mockResolvedValue({
      id: "T1",
      userId: "U1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    transactionMock.mockRejectedValueOnce(new Error("db down"));
    const res = await POST(makeRequest({ token: "good", password: "longenough" }));
    expect(res.status).toBe(500);
  });
});
