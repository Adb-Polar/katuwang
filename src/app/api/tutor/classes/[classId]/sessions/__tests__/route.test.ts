import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, tutorProfileFindUnique, classFindUnique, sessionFindMany, sessionCreate } = vi.hoisted(
  () => ({
    getServerSessionMock: vi.fn(),
    tutorProfileFindUnique: vi.fn(),
    classFindUnique: vi.fn(),
    sessionFindMany: vi.fn(),
    sessionCreate: vi.fn(),
  })
);

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: classFindUnique },
    classSession: { findMany: sessionFindMany, create: sessionCreate },
  },
}));

import { POST } from "@/app/api/tutor/classes/[classId]/sessions/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/sessions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function post(body: unknown, classId = "c1") {
  return POST(makeRequest(body), { params: Promise.resolve({ classId }) });
}

const validBody = {
  topic: "Algebraic Expressions",
  scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  duration: 60,
};

const scheduledClass = {
  id: "c1",
  tutorProfileId: "tp1",
  status: "SCHEDULED",
  topics: [{ topic: "Algebraic Expressions" }],
};

describe("POST /api/tutor/classes/[classId]/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindMany.mockResolvedValue([]);
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await post(validBody);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the class doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(null);
    const res = await post(validBody);
    expect(res.status).toBe(404);
  });

  it("returns 403 when the tutor doesn't own the class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue({ ...scheduledClass, tutorProfileId: "other-tp" });
    const res = await post(validBody);
    expect(res.status).toBe(403);
  });

  it("returns 403 when the class is suspended", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue({ ...scheduledClass, status: "SUSPENDED" });
    const res = await post(validBody);
    expect(res.status).toBe(403);
  });

  it("returns 400 when the class isn't SCHEDULED", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue({ ...scheduledClass, status: "COMPLETED" });
    const res = await post(validBody);
    expect(res.status).toBe(400);
  });

  it("returns 400 when the topic isn't in the class's topics", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(scheduledClass);
    const res = await post({ ...validBody, topic: "Not In Class" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a past scheduledAt", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(scheduledClass);
    const res = await post({ ...validBody, scheduledAt: new Date(Date.now() - 3600_000).toISOString() });
    expect(res.status).toBe(400);
  });

  it("returns 409 on overlap with another session", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(scheduledClass);
    sessionFindMany.mockResolvedValue([{ scheduledAt: new Date(validBody.scheduledAt), duration: 60 }]);
    const res = await post(validBody);
    expect(res.status).toBe(409);
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("returns 201 on success", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(scheduledClass);
    sessionCreate.mockResolvedValue({ id: "s1", classId: "c1", ...validBody, status: "SCHEDULED" });

    const res = await post(validBody);
    expect(res.status).toBe(201);
    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ classId: "c1", topic: "Algebraic Expressions" }),
      })
    );
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockRejectedValue(new Error("db down"));
    const res = await post(validBody);
    expect(res.status).toBe(500);
  });
});
