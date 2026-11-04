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

function request(password = "correct", confirm = "DELETE") {
  return new NextRequest("http://localhost/api/account", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
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

  it("deletes only the authenticated account after confirmation", async () => {
    const response = await DELETE(request());
    expect(response.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith({ where: { id: "learner-1" } });
  });
});
