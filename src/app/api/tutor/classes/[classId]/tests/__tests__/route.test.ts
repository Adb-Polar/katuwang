import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classTestFindMany,
  classTestFindUnique,
  classTestCreate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classTestFindMany: vi.fn(),
  classTestFindUnique: vi.fn(),
  classTestCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classTest: {
      findMany: classTestFindMany,
      findUnique: classTestFindUnique,
      create: classTestCreate,
    },
  },
}));

import { GET, POST } from "@/app/api/tutor/classes/[classId]/tests/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = (classId = "c1") => ({ params: Promise.resolve({ classId }) });

function post(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/tests", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({
    id: "c1",
    tutorProfileId: "tp1",
    status: "SCHEDULED",
    subject: "MATH",
    topics: [{ topic: "Algebraic Expressions" }],
  });
});

describe("POST /api/tutor/classes/[classId]/tests", () => {
  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await POST(post({ kind: "PRE", title: "Pre-test" }), ctx());
    expect(res.status).toBe(401);
  });

  it("403 when the class belongs to another tutor", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "OTHER", status: "SCHEDULED", subject: "MATH", topics: [] });
    const res = await POST(post({ kind: "PRE", title: "Pre-test" }), ctx());
    expect(res.status).toBe(403);
  });

  it("400 for an invalid kind", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(post({ kind: "MIDTERM", title: "x" }), ctx());
    expect(res.status).toBe(400);
  });

  it("409 when a test of that kind already exists", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classTestFindUnique.mockResolvedValue({ id: "existing" });
    const res = await POST(post({ kind: "PRE", title: "Pre-test" }), ctx());
    expect(res.status).toBe(409);
    expect(classTestCreate).not.toHaveBeenCalled();
  });

  it("201 creates the test", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classTestFindUnique.mockResolvedValue(null);
    classTestCreate.mockResolvedValue({ id: "t1", kind: "PRE" });
    const res = await POST(post({ kind: "PRE", title: "Algebra Pre-test" }), ctx());
    expect(res.status).toBe(201);
    expect(classTestCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ classId: "c1", kind: "PRE", title: "Algebra Pre-test" }) })
    );
  });
});

describe("GET /api/tutor/classes/[classId]/tests", () => {
  it("returns the class's tests for the owner", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classTestFindMany.mockResolvedValue([{ id: "t1", kind: "PRE" }]);
    const res = await GET(new NextRequest("http://localhost/api/tutor/classes/c1/tests"), ctx());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.tests).toHaveLength(1);
  });
});
