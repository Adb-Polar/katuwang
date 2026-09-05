import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock, createMock, auditLogCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  createMock: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessmentQuestion: { findMany: findManyMock, count: countMock, create: createMock },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        assessmentQuestion: { create: createMock },
        auditLog: { create: auditLogCreate },
      }),
  },
}));

import { GET, POST } from "@/app/api/admin/assessment-questions/route";

const admin = { user: { id: "A1", role: "ADMIN" } };

function getReq(url = "http://localhost/api/admin/assessment-questions") {
  return new NextRequest(url, { method: "GET" });
}
function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/assessment-questions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = {
  subject: "MATH",
  topic: "Algebraic Expressions",
  prompt: "Simplify 3x + 2x",
  options: [
    { text: "5x", isCorrect: true },
    { text: "6x", isCorrect: false },
  ],
};

describe("GET /api/admin/assessment-questions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it("returns rows with an inUse flag derived from the attemptItems count", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([
      { id: "q1", prompt: "p", options: [], _count: { attemptItems: 0 } },
      { id: "q2", prompt: "p", options: [], _count: { attemptItems: 3 } },
    ]);
    countMock.mockResolvedValue(2);

    const res = await GET(getReq("http://localhost/api/admin/assessment-questions?subject=MATH&topic=Algebraic%20Expressions"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.total).toBe(2);
    expect(json.questions.map((q: { inUse: boolean }) => q.inUse)).toEqual([false, true]);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          subject: "MATH",
          topic: "Algebraic Expressions",
          origin: "BANK",
        }),
      })
    );
  });

  it("never lists tutor-authored questions — the query is scoped to origin BANK", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
    await GET(getReq());
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ origin: "BANK" }) })
    );
  });
});

describe("POST /api/admin/assessment-questions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(401);
  });

  it("400 when not exactly one option is correct", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await POST(
      postReq({ ...validBody, options: [
        { text: "a", isCorrect: true },
        { text: "b", isCorrect: true },
      ] })
    );
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 when the topic is not valid for the subject", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await POST(postReq({ ...validBody, topic: "Not A Real Topic" }));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("201 creates the question with ordered options and writes an audit row", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    createMock.mockResolvedValue({ id: "q1", options: [] });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(201);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subject: "MATH",
          topic: "Algebraic Expressions",
          createdById: "A1",
          origin: "BANK",
          options: { create: [
            { text: "5x", isCorrect: true, position: 0 },
            { text: "6x", isCorrect: false, position: 1 },
          ] },
        }),
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "QUESTION_CREATED", targetType: "QUESTION" }),
      })
    );
  });

  it("500 when the create throws", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    createMock.mockRejectedValue(new Error("db down"));
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });
});
