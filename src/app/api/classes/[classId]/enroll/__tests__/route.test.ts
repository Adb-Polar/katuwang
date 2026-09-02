import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorClassFindUnique,
  tutorClassUpdateMany,
  enrollmentFindUnique,
  enrollmentCreate,
  enrollmentDelete,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  tutorClassUpdateMany: vi.fn(),
  enrollmentFindUnique: vi.fn(),
  enrollmentCreate: vi.fn(),
  enrollmentDelete: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: {
      findUnique: tutorClassFindUnique,
      updateMany: tutorClassUpdateMany,
    },
    classEnrollment: {
      findUnique: enrollmentFindUnique,
      create: enrollmentCreate,
      delete: enrollmentDelete,
    },
  },
}));

import { POST, DELETE } from "@/app/api/classes/[classId]/enroll/route";

function makeRequest(method: string) {
  return new NextRequest("http://localhost/api/classes/c1/enroll", { method });
}

function makeParams(classId = "c1") {
  return { params: Promise.resolve({ classId }) };
}

const futureClass = {
  id: "c1",
  status: "SCHEDULED",
  published: true,
  sessions: [
    { id: "s1", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 60 * 60 * 1000), duration: 60 },
  ],
  maxStudents: 2,
  _count: { enrollments: 0 },
};

describe("POST /api/classes/[classId]/enroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tutorClassUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("returns 401 when unauthenticated or wrong role", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(401);
    expect(tutorClassFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the class does not exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 400 when the class is not scheduled", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue({ ...futureClass, status: "CANCELLED" });

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no longer accepting enrollments/i);
  });

  it("returns 400 when the class is unpublished", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue({ ...futureClass, published: false });

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no longer accepting enrollments/i);
  });

  it("returns 400 when the class has no upcoming sessions", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue({
      ...futureClass,
      sessions: [
        { id: "s1", status: "SCHEDULED", scheduledAt: new Date(Date.now() - 60 * 60 * 1000), duration: 60 },
      ],
    });

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no upcoming sessions/i);
  });

  it("returns 409 when the class is full", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue({
      ...futureClass,
      _count: { enrollments: 2 },
    });

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already full/i);
  });

  it("returns 409 when already enrolled", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue(futureClass);
    enrollmentFindUnique.mockResolvedValue({ id: "e1" });

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already enrolled/i);
    expect(enrollmentCreate).not.toHaveBeenCalled();
  });

  it("lazily reinstates expired class suspensions before checking eligibility", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue(futureClass);
    enrollmentFindUnique.mockResolvedValue(null);
    enrollmentCreate.mockResolvedValue({ id: "e1", classId: "c1", learnerId: "l1" });

    await POST(makeRequest("POST"), makeParams());
    expect(tutorClassUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "SUSPENDED" }),
        data: { status: "SCHEDULED", suspendedReason: null, suspendedUntil: null },
      })
    );
  });

  it("returns 201 on successful enrollment", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue(futureClass);
    enrollmentFindUnique.mockResolvedValue(null);
    enrollmentCreate.mockResolvedValue({ id: "e1", classId: "c1", learnerId: "l1" });

    const res = await POST(makeRequest("POST"), makeParams());
    expect(res.status).toBe(201);
    expect(enrollmentCreate).toHaveBeenCalledWith({
      data: { classId: "c1", learnerId: "l1" },
    });
  });
});

describe("DELETE /api/classes/[classId]/enroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated or wrong role", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(401);
    expect(tutorClassFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the class does not exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 404 when not enrolled", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue(futureClass);
    enrollmentFindUnique.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not enrolled/i);
  });

  it("returns 400 when the class is not scheduled", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue({ ...futureClass, status: "COMPLETED" });
    enrollmentFindUnique.mockResolvedValue({ id: "e1" });

    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/already completed or cancelled/i);
    expect(enrollmentDelete).not.toHaveBeenCalled();
  });

  it("returns 200 on successful unenrollment", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    tutorClassFindUnique.mockResolvedValue(futureClass);
    enrollmentFindUnique.mockResolvedValue({ id: "e1" });
    enrollmentDelete.mockResolvedValue({ id: "e1" });

    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(200);
    expect(enrollmentDelete).toHaveBeenCalledWith({ where: { id: "e1" } });
  });
});
