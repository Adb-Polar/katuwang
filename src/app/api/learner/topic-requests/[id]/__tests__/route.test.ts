import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findUniqueMock, updateMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { topicRequest: { findUnique: findUniqueMock, update: updateMock } },
}));

import { PATCH } from "@/app/api/learner/topic-requests/[id]/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/learner/topic-requests/r1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = Promise.resolve({ id: "r1" });
const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };

describe("PATCH /api/learner/topic-requests/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404 when the request is not the caller's", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findUniqueMock.mockResolvedValue({ learnerId: "someone-else", status: "OPEN" });
    const res = await PATCH(makeRequest({ status: "CANCELLED" }), { params });
    expect(res.status).toBe(404);
  });

  it("400 when the request is not open", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findUniqueMock.mockResolvedValue({ learnerId: "L1", status: "FULFILLED" });
    const res = await PATCH(makeRequest({ status: "CANCELLED" }), { params });
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 for a status other than CANCELLED", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await PATCH(makeRequest({ status: "OPEN" }), { params });
    expect(res.status).toBe(400);
  });

  it("cancels an open request", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findUniqueMock.mockResolvedValue({ learnerId: "L1", status: "OPEN" });
    updateMock.mockResolvedValue({ id: "r1", status: "CANCELLED" });
    const res = await PATCH(makeRequest({ status: "CANCELLED" }), { params });
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "r1" }, data: { status: "CANCELLED" } })
    );
  });

  it("edits an open request's criteria, replacing topics + slots", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findUniqueMock.mockResolvedValue({ learnerId: "L1", status: "OPEN" });
    updateMock.mockResolvedValue({ id: "r1", status: "OPEN" });

    const res = await PATCH(
      makeRequest({
        subject: "MATH",
        topics: ["Fractions & Decimals"],
        gradeLevel: "GRADE_9",
        preferredSlots: [{ day: "MONDAY", startTime: "15:00", endTime: "17:00" }],
        note: "focus on word problems",
      }),
      { params }
    );

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: expect.objectContaining({
          subject: "MATH",
          gradeLevel: "GRADE_9",
          note: "focus on word problems",
          topics: { deleteMany: {}, create: [{ topic: "Fractions & Decimals" }] },
          slots: {
            deleteMany: {},
            create: [{ day: "MONDAY", startTime: "15:00", endTime: "17:00" }],
          },
        }),
      })
    );
  });

  it("400 when editing a request that is no longer open", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findUniqueMock.mockResolvedValue({ learnerId: "L1", status: "FULFILLED" });
    const res = await PATCH(
      makeRequest({ subject: "MATH", topics: ["Fractions & Decimals"], gradeLevel: "GRADE_9" }),
      { params }
    );
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
