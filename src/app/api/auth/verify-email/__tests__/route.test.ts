import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { findUniqueMock, userUpdateMock, tokenUpdateMock, transactionMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  userUpdateMock: vi.fn(),
  tokenUpdateMock: vi.fn(),
  transactionMock: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: { findUnique: findUniqueMock, update: tokenUpdateMock },
    user: { update: userUpdateMock },
    $transaction: transactionMock,
  },
}));

import { POST } from "@/app/api/auth/verify-email/route";

const INVALID_MSG = "This verification link is invalid or has expired.";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 when the token is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("400 when the token does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ token: "nope" }));
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
    const res = await POST(makeRequest({ token: "used" }));
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
    const res = await POST(makeRequest({ token: "old" }));
    expect(res.status).toBe(400);
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("sets emailVerifiedAt and burns the token on success", async () => {
    findUniqueMock.mockResolvedValue({
      id: "T1",
      userId: "U1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const res = await POST(makeRequest({ token: "good" }));

    expect(res.status).toBe(200);
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "U1" },
      data: { emailVerifiedAt: expect.any(Date) },
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
    const res = await POST(makeRequest({ token: "good" }));
    expect(res.status).toBe(500);
  });
});
