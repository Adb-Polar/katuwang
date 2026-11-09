import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { sessionMock, findUser, compareMock, deleteUser, transactionMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  findUser: vi.fn(),
  compareMock: vi.fn(),
  deleteUser: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: sessionMock }));
vi.mock("bcryptjs", () => ({ default: { compare: compareMock } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUser },
    $transaction: transactionMock,
  },
}));

import { DELETE } from "@/app/api/account/route";

function request(password = "correct", confirm = "DELETE", headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/account", {
    method: "DELETE",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ password, confirm }),
  });
}

describe("DELETE /api/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({ user: { id: "learner-1", role: "STUDENT_LEARNER" } });
    findUser.mockResolvedValue({ id: "learner-1", password: "hash", tutorProfile: null });
    compareMock.mockResolvedValue(true);
    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<void>) => {
      const noop = vi.fn();
      return callback({
        chatbotMiss: { updateMany: noop },
        classAppeal: { updateMany: noop },
        report: { updateMany: noop },
        questionRequest: { updateMany: noop },
        auditLog: { deleteMany: noop },
        classRecommendation: { deleteMany: noop },
        user: { delete: deleteUser },
      });
    });
  });

  it("requires a signed-in learner or tutor", async () => {
    sessionMock.mockResolvedValue(null);
    expect((await DELETE(request())).status).toBe(401);
    expect(findUser).not.toHaveBeenCalled();
  });

  it("requires the confirmation phrase and current password", async () => {
    expect((await DELETE(request("correct", "no"))).status).toBe(400);
    expect(findUser).not.toHaveBeenCalled();
    compareMock.mockResolvedValue(false);
    const response = await DELETE(request("wrong"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Incorrect password.");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retains accounts referenced by issued certificates", async () => {
    findUser.mockResolvedValue({ id: "learner-1", password: "hash", tutorProfile: null, _count: { learnerCompletionCertificates: 1, tutorCompletionCertificates: 0 } });
    const response = await DELETE(request());
    expect(response.status).toBe(409);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("deletes only the authenticated account after confirmation", async () => {
    const response = await DELETE(request());
    expect(response.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith({ where: { id: "learner-1" } });
  });

  it("accepts the public Host when the request URL uses an internal origin", async () => {
    const response = await DELETE(request("correct", "DELETE", {
      origin: "https://katuwang.example",
      host: "katuwang.example",
    }));

    expect(response.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith({ where: { id: "learner-1" } });
  });

  it("accepts X-Forwarded-Host when the proxy rewrites Host", async () => {
    const response = await DELETE(request("correct", "DELETE", {
      origin: "https://katuwang.example",
      host: "internal:3000",
      "x-forwarded-host": "katuwang.example",
    }));

    expect(response.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith({ where: { id: "learner-1" } });
  });

  it("rejects a different browser origin before checking the session", async () => {
    const response = await DELETE(request("correct", "DELETE", {
      origin: "https://other.example",
      host: "katuwang.example",
    }));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Invalid request origin.");
    expect(sessionMock).not.toHaveBeenCalled();
  });

  it("rejects malformed Origin headers", async () => {
    const response = await DELETE(request("correct", "DELETE", {
      origin: "not-an-origin",
      host: "katuwang.example",
    }));

    expect(response.status).toBe(403);
    expect(sessionMock).not.toHaveBeenCalled();
  });
});
