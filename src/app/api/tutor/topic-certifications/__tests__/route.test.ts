import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, tutorProfileFindUnique, topicCertificationFindMany, topicCertificationUpsert } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    tutorProfileFindUnique: vi.fn(),
    topicCertificationFindMany: vi.fn(),
    topicCertificationUpsert: vi.fn(),
  }));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    topicCertification: { findMany: topicCertificationFindMany, upsert: topicCertificationUpsert },
  },
}));

import { GET, POST } from "@/app/api/tutor/topic-certifications/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/topic-certifications", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/tutor/topic-certifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when no tutor profile exists", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns 200 with the tutor's certifications", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertificationFindMany.mockResolvedValue([
      { id: "c1", subject: "MATH", topic: "Algebraic Expressions", status: "PENDING" },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
  });
});

describe("POST /api/tutor/topic-certifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ subject: "MATH", topic: "Algebraic Expressions" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no tutor profile exists", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ subject: "MATH", topic: "Algebraic Expressions" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid input", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await POST(makeRequest({ subject: "MATH" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a topic that doesn't belong to the subject", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await POST(makeRequest({ subject: "MATH", topic: "Not A Real Topic" }));
    expect(res.status).toBe(400);
    expect(topicCertificationUpsert).not.toHaveBeenCalled();
  });

  it("upserts a PENDING certification request", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertificationUpsert.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      subject: "MATH",
      topic: "Algebraic Expressions",
      status: "PENDING",
    });

    const res = await POST(makeRequest({ subject: "MATH", topic: "Algebraic Expressions" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.status).toBe("PENDING");
    expect(topicCertificationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tutorProfileId_subject_topic: { tutorProfileId: "tp1", subject: "MATH", topic: "Algebraic Expressions" },
        },
        create: expect.objectContaining({ status: "PENDING" }),
      })
    );
  });
});
