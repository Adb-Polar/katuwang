import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { findUniqueMock, updateManyMock, createMock, transactionMock, sendMailMock } = vi.hoisted(
  () => ({
    findUniqueMock: vi.fn(),
    updateManyMock: vi.fn(),
    createMock: vi.fn(),
    transactionMock: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    sendMailMock: vi.fn(),
  })
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    verificationToken: { updateMany: updateManyMock, create: createMock },
    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/mail", () => ({
  sendMail: sendMailMock,
  renderVerificationEmail: (url: string) => ({ subject: "s", html: url, text: url }),
}));

import { POST } from "@/app/api/auth/resend-verification/route";

const NEUTRAL_MSG = "If an account matches that address and needs verification, we've sent a new link.";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 on an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("issues a hashed single-use token for an unverified account", async () => {
    findUniqueMock.mockResolvedValue({ id: "U1", emailVerifiedAt: null, status: "ACTIVE" });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe(NEUTRAL_MSG);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { userId: "U1", usedAt: null },
      data: expect.objectContaining({ usedAt: expect.any(Date) }),
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    const created = createMock.mock.calls[0][0].data;
    expect(created.userId).toBe("U1");
    expect(created.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("emails the verify link (with the raw token) to the submitted address", async () => {
    findUniqueMock.mockResolvedValue({ id: "U1", emailVerifiedAt: null, status: "ACTIVE" });
    await POST(makeRequest({ email: "user@example.com" }));

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.to).toBe("user@example.com");
    expect(arg.html).toMatch(/\/verify-email\?token=[a-f0-9]{64}$/);
  });

  it("returns the neutral message without a token when no account matches", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ email: "ghost@example.com" }));
    expect((await res.json()).message).toBe(NEUTRAL_MSG);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("does not issue a token for an already-verified account", async () => {
    findUniqueMock.mockResolvedValue({ id: "U2", emailVerifiedAt: new Date(), status: "ACTIVE" });
    const res = await POST(makeRequest({ email: "verified@example.com" }));
    expect((await res.json()).message).toBe(NEUTRAL_MSG);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("does not issue a token for a banned account", async () => {
    findUniqueMock.mockResolvedValue({ id: "U3", emailVerifiedAt: null, status: "BANNED" });
    const res = await POST(makeRequest({ email: "banned@example.com" }));
    expect((await res.json()).message).toBe(NEUTRAL_MSG);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("500 when the lookup throws", async () => {
    findUniqueMock.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(500);
  });
});
