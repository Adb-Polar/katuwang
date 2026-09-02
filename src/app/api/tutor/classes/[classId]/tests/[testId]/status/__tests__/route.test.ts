import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classTestFindUnique,
  classTestUpdate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classTestFindUnique: vi.fn(),
  classTestUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classTest: { findUnique: classTestFindUnique, update: classTestUpdate },
  },
}));

import { PATCH } from "@/app/api/tutor/classes/[classId]/tests/[testId]/status/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", testId: "t1" }) });
const req = (body: unknown) =>
  new NextRequest("http://localhost/api/tutor/classes/c1/tests/t1/status", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(tutor);
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", status: "SCHEDULED", subject: "MATH", topics: [] });
});

describe("PATCH .../tests/[testId]/status", () => {
  it("400 when publishing a test with no questions", async () => {
    classTestFindUnique.mockResolvedValue({ id: "t1", classId: "c1", status: "DRAFT", questions: [] });
    const res = await PATCH(req({ status: "PUBLISHED" }), ctx());
    expect(res.status).toBe(400);
    expect(classTestUpdate).not.toHaveBeenCalled();
  });

  it("publishes a draft with questions and stamps publishedAt", async () => {
    classTestFindUnique.mockResolvedValue({
      id: "t1",
      classId: "c1",
      status: "DRAFT",
      questions: [{ id: "l1" }],
    });
    classTestUpdate.mockResolvedValue({ id: "t1", status: "PUBLISHED" });
    const res = await PATCH(req({ status: "PUBLISHED" }), ctx());
    expect(res.status).toBe(200);
    expect(classTestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PUBLISHED" }) })
    );
    expect(classTestUpdate.mock.calls[0][0].data.publishedAt).toBeInstanceOf(Date);
  });

  it("409 when closing a test that is not published", async () => {
    classTestFindUnique.mockResolvedValue({ id: "t1", classId: "c1", status: "DRAFT", questions: [{ id: "l1" }] });
    const res = await PATCH(req({ status: "CLOSED" }), ctx());
    expect(res.status).toBe(409);
  });

  it("closes a published test", async () => {
    classTestFindUnique.mockResolvedValue({ id: "t1", classId: "c1", status: "PUBLISHED", questions: [{ id: "l1" }] });
    classTestUpdate.mockResolvedValue({ id: "t1", status: "CLOSED" });
    const res = await PATCH(req({ status: "CLOSED" }), ctx());
    expect(res.status).toBe(200);
    expect(classTestUpdate.mock.calls[0][0].data.closedAt).toBeInstanceOf(Date);
  });
});
