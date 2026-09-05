import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classSessionFindUnique,
  sessionTestFindUnique,
  sessionTestUpdate,
  classEnrollmentFindMany,
  notificationCreateMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classSessionFindUnique: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  sessionTestUpdate: vi.fn(),
  classEnrollmentFindMany: vi.fn(),
  notificationCreateMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classSession: { findUnique: classSessionFindUnique },
    sessionTest: { findUnique: sessionTestFindUnique, update: sessionTestUpdate },
    platformSetting: { findUnique: vi.fn().mockResolvedValue(null) }, // sessionTestsEnabled defaults to true
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        sessionTest: { update: sessionTestUpdate },
        classEnrollment: { findMany: classEnrollmentFindMany },
        notification: { createMany: notificationCreateMany },
      }),
  },
}));

import { PATCH } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", sessionId: "s1" }) });

function patch(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/sessions/s1/test/status", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(tutor);
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", status: "SCHEDULED", subject: "MATH", topics: [] });
  classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "SCHEDULED", topic: "Fractions" });
  classEnrollmentFindMany.mockResolvedValue([{ learnerId: "L1" }, { learnerId: "L2" }]);
});

describe("PATCH /test/status", () => {
  it("400 before publishing an empty test", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [], _count: { attempts: 0 } });
    const res = await PATCH(patch({ status: "PUBLISHED" }), ctx());
    expect(res.status).toBe(400);
  });

  it("publishing notifies every enrolled learner with SESSION_PRETEST_OPEN", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [{ position: 0 }], _count: { attempts: 0 } });
    sessionTestUpdate.mockResolvedValue({ id: "st1", status: "PUBLISHED" });
    const res = await PATCH(patch({ status: "PUBLISHED" }), ctx());
    expect(res.status).toBe(200);
    expect(notificationCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: "L1", type: "SESSION_PRETEST_OPEN", message: expect.any(String), link: expect.any(String) },
        { userId: "L2", type: "SESSION_PRETEST_OPEN", message: expect.any(String), link: expect.any(String) },
      ],
    });
  });

  it("409 closing a test that isn't published", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [], _count: { attempts: 0 } });
    const res = await PATCH(patch({ status: "CLOSED" }), ctx());
    expect(res.status).toBe(409);
  });

  it("closes a published test", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "PUBLISHED", questions: [{ position: 0 }], _count: { attempts: 0 } });
    sessionTestUpdate.mockResolvedValue({ id: "st1", status: "CLOSED" });
    const res = await PATCH(patch({ status: "CLOSED" }), ctx());
    expect(res.status).toBe(200);
    expect(notificationCreateMany).not.toHaveBeenCalled();
  });
});
