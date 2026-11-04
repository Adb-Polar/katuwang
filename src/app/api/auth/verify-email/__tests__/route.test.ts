import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { hashVerificationCode } from "@/lib/emailVerification";

const { userFindUnique, tokenFindFirst, tokenUpdateMany, userUpdate, transactionMock } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  tokenFindFirst: vi.fn(),
  tokenUpdateMany: vi.fn(),
  userUpdate: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUnique, update: userUpdate },
    verificationToken: { findFirst: tokenFindFirst, updateMany: tokenUpdateMany },
    $transaction: transactionMock,
  },
}));

import { POST } from "@/app/api/auth/verify-email/route";

const email = "user@example.com";
const code = "012345";
const INVALID_MSG = "This verification code is invalid or has expired.";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-email-codes");
    userFindUnique.mockResolvedValue({ id: "U1", emailVerifiedAt: null, status: "ACTIVE" });
    tokenFindFirst.mockImplementation(async () => ({
      id: "T1",
      tokenHash: hashVerificationCode(email, code),
      expiresAt: new Date(Date.now() + 60_000),
    }));
    tokenUpdateMany.mockResolvedValue({ count: 1 });
    transactionMock.mockImplementation(async (fn) => fn({
      user: { update: userUpdate },
      verificationToken: { updateMany: tokenUpdateMany },
    }));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects a missing or malformed code", async () => {
    expect((await POST(makeRequest({ email }))).status).toBe(400);
    expect((await POST(makeRequest({ email, code: "12345a" }))).status).toBe(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an unknown email without looking up a code", async () => {
    userFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ email, code }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(INVALID_MSG);
    expect(tokenFindFirst).not.toHaveBeenCalled();
  });

  it("rejects a wrong code", async () => {
    const res = await POST(makeRequest({ email, code: "999999" }));
    expect(res.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects an expired code", async () => {
    tokenFindFirst.mockResolvedValue({ id: "T1", tokenHash: hashVerificationCode(email, code), expiresAt: new Date(Date.now() - 1) });
    const res = await POST(makeRequest({ email, code }));
    expect(res.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("marks the code used and verifies the email atomically", async () => {
    const res = await POST(makeRequest({ email: "USER@example.com", code }));
    expect(res.status).toBe(200);
    expect(userFindUnique).toHaveBeenCalledWith({ where: { email }, select: expect.any(Object) });
    expect(tokenUpdateMany).toHaveBeenCalledWith({
      where: { id: "T1", usedAt: null, expiresAt: { gt: expect.any(Date) } },
      data: { usedAt: expect.any(Date) },
    });
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: "U1" }, data: { emailVerifiedAt: expect.any(Date) } });
  });

  it("rejects a code already consumed by another request", async () => {
    tokenUpdateMany.mockResolvedValue({ count: 0 });
    const res = await POST(makeRequest({ email, code }));
    expect(res.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 when the transaction fails", async () => {
    transactionMock.mockRejectedValueOnce(new Error("db down"));
    const res = await POST(makeRequest({ email, code }));
    expect(res.status).toBe(500);
  });
});
