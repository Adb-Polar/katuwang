import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorClassFindUnique,
  enrollmentFindUnique,
  classTestFindUnique,
  attemptFindUnique,
  attemptCreate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  enrollmentFindUnique: vi.fn(),
  classTestFindUnique: vi.fn(),
  attemptFindUnique: vi.fn(),
  attemptCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findUnique: tutorClassFindUnique },
    classEnrollment: { findUnique: enrollmentFindUnique },
    classTest: { findUnique: classTestFindUnique },
    classTestAttempt: { findUnique: attemptFindUnique, create: attemptCreate },
  },
}));

import { POST } from "@/app/api/learner/classes/[classId]/tests/[testId]/start/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", testId: "t1" }) });
const req = () =>
  new NextRequest("http://localhost/api/learner/classes/c1/tests/t1/start", { method: "POST" });

const publishedTest = {
  id: "t1",
  classId: "c1",
  status: "PUBLISHED",
  questions: [
    { questionId: "q1", position: 0 },
    { questionId: "q2", position: 1 },
  ],
};
const fakeAttempt = {
  id: "a1",
  status: "IN_PROGRESS",
  totalQuestions: 2,
  startedAt: new Date(),
  submittedAt: null,
  classTest: { id: "t1", kind: "PRE", title: "Pre", instructions: null },
  items: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(learner);
  tutorClassFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
  enrollmentFindUnique.mockResolvedValue({ id: "e1" });
  classTestFindUnique.mockResolvedValue(publishedTest);
  attemptFindUnique.mockResolvedValue(null);
});

describe("POST .../tests/[testId]/start", () => {
  it("403 when the learner is not enrolled", async () => {
    enrollmentFindUnique.mockResolvedValue(null);
    const res = await POST(req(), ctx());
    expect(res.status).toBe(403);
  });

  it("400 when the test is not published and no attempt exists", async () => {
    classTestFindUnique.mockResolvedValue({ ...publishedTest, status: "DRAFT" });
    const res = await POST(req(), ctx());
    expect(res.status).toBe(400);
    expect(attemptCreate).not.toHaveBeenCalled();
  });

  it("409 when the learner already submitted", async () => {
    attemptFindUnique.mockResolvedValue({ ...fakeAttempt, status: "SUBMITTED" });
    const res = await POST(req(), ctx());
    expect(res.status).toBe(409);
  });

  it("resumes an in-progress attempt (200)", async () => {
    attemptFindUnique.mockResolvedValue(fakeAttempt);
    const res = await POST(req(), ctx());
    expect(res.status).toBe(200);
    expect(attemptCreate).not.toHaveBeenCalled();
  });

  it("201 snapshots the test's questions into a new attempt", async () => {
    attemptCreate.mockResolvedValue(fakeAttempt);
    const res = await POST(req(), ctx());
    expect(res.status).toBe(201);
    expect(attemptCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          classTestId: "t1",
          learnerId: "L1",
          totalQuestions: 2,
          items: { create: [
            { questionId: "q1", position: 0 },
            { questionId: "q2", position: 1 },
          ] },
        }),
      })
    );
  });
});
