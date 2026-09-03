import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { findFirstMock, updateManyMock, createMock, transactionMock, sendMailMock } = vi.hoisted(
  () => ({
    findFirstMock: vi.fn(),
    updateManyMock: vi.fn(),
    createMock: vi.fn(),
    transactionMock: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    sendMailMock: vi.fn(),
  })
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: findFirstMock },
    passwordResetToken: { updateMany: updateManyMock, create: createMock },
    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/mail", () => ({
  sendMail: sendMailMock,
  renderPasswordResetEmail: (url: string) => ({ subject: "s", html: url, text: url }),
}));

import { POST } from "@/app/api/auth/forgot-password/route";

const NEUTRAL_MSG = "If an account matches that address, we've sent a password reset link.";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 on an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("issues a hashed single-use token for a matching active account", async () => {
    findFirstMock.mockResolvedValue({ id: "U1", status: "ACTIVE" });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe(NEUTRAL_MSG);
    // earlier unused tokens invalidated, then a new one created
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { userId: "U1", usedAt: null },
      data: expect.objectContaining({ usedAt: expect.any(Date) }),
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    const created = createMock.mock.calls[0][0].data;
    expect(created.userId).toBe("U1");
    expect(created.tokenHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex, not the raw token
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("emails the reset link (with the raw token) to the submitted address", async () => {
    findFirstMock.mockResolvedValue({ id: "U1", status: "ACTIVE" });
    await POST(makeRequest({ email: "user@example.com" }));

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.to).toBe("user@example.com");
    expect(arg.html).toMatch(/\/reset-password\?token=[a-f0-9]{64}$/);
  });

  it("still returns the neutral 200 when the email send fails", async () => {
    findFirstMock.mockResolvedValue({ id: "U1", status: "ACTIVE" });
    sendMailMock.mockRejectedValueOnce(new Error("smtp down"));

    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(200);
    expect((await res.json()).message).toBe(NEUTRAL_MSG);
    expect(createMock).toHaveBeenCalledTimes(1); // token was still issued
  });

  it("matches on the recovery email as well as the primary", async () => {
    findFirstMock.mockResolvedValue({ id: "U2", status: "ACTIVE" });
    await POST(makeRequest({ email: "backup@example.com" }));
    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ email: "backup@example.com" }, { recoveryEmail: "backup@example.com" }] },
      })
    );
  });

  it("returns the neutral message without a token when no account matches", async () => {
    findFirstMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ email: "ghost@example.com" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe(NEUTRAL_MSG);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("does not issue a token for a banned account", async () => {
    findFirstMock.mockResolvedValue({ id: "U3", status: "BANNED" });
    const res = await POST(makeRequest({ email: "banned@example.com" }));
    expect((await res.json()).message).toBe(NEUTRAL_MSG);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("500 when the lookup throws", async () => {
    findFirstMock.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(500);
  });
});
