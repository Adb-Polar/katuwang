import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  findUniqueMock,
  updateMock,
  deleteMock,
  optionDeleteMany,
  optionCreateMany,
  auditLogCreate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  optionDeleteMany: vi.fn(),
  optionCreateMany: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessmentQuestion: {
      findUnique: findUniqueMock,
      findFirst: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
    assessmentOption: { deleteMany: optionDeleteMany, createMany: optionCreateMany },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        assessmentQuestion: { update: updateMock, delete: deleteMock },
        assessmentOption: { deleteMany: optionDeleteMany, createMany: optionCreateMany },
        auditLog: { create: auditLogCreate },
      }),
  },
}));

import { PATCH, DELETE } from "@/app/api/admin/assessment-questions/[questionId]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const params = (questionId = "q1") => ({ params: Promise.resolve({ questionId }) });

function patchReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/assessment-questions/q1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
function deleteReq() {
  return new NextRequest("http://localhost/api/admin/assessment-questions/q1", { method: "DELETE" });
}

const usedQuestion = {
  id: "q1",
  subject: "MATH",
  topic: "Algebraic Expressions",
  active: true,
  options: [],
  _count: { attemptItems: 4, sessionTestItems: 0 },
};
const freshQuestion = { ...usedQuestion, _count: { attemptItems: 0, sessionTestItems: 0 } };

describe("PATCH /api/admin/assessment-questions/[questionId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("409 when trying to edit content of an in-use question", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(usedQuestion);

    const res = await PATCH(patchReq({ prompt: "changed prompt text" }), params());
    expect(res.status).toBe(409);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("allows toggling `active` on an in-use question and audits a retire", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(usedQuestion);
    updateMock.mockResolvedValue({ id: "q1", active: false, options: [] });

    const res = await PATCH(patchReq({ active: false }), params());
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: false }) })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "QUESTION_RETIRED" }) })
    );
  });

  it("replaces options when editing a fresh question", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(freshQuestion);
    updateMock.mockResolvedValue({ id: "q1", options: [] });

    const res = await PATCH(
      patchReq({
        prompt: "new prompt here",
        options: [
          { text: "a", isCorrect: true },
          { text: "b", isCorrect: false },
        ],
      }),
      params()
    );
    expect(res.status).toBe(200);
    expect(optionDeleteMany).toHaveBeenCalledWith({ where: { questionId: "q1" } });
    expect(optionCreateMany).toHaveBeenCalled();
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "QUESTION_UPDATED" }) })
    );
  });
});

describe("DELETE /api/admin/assessment-questions/[questionId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("409 when the question has been used", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(usedQuestion);
    const res = await DELETE(deleteReq(), params());
    expect(res.status).toBe(409);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes an unused question and audits it", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(freshQuestion);
    deleteMock.mockResolvedValue({ id: "q1" });
    const res = await DELETE(deleteReq(), params());
    expect(res.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "q1" } });
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "QUESTION_DELETED" }) })
    );
  });
});
