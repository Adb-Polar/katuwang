import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  topicCertificationFindMany,
  topicCertificationFindUnique,
  topicCertificationUpsert,
  tutorClassFindMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  topicCertificationFindMany: vi.fn(),
  topicCertificationFindUnique: vi.fn(),
  topicCertificationUpsert: vi.fn(),
  tutorClassFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    topicCertification: {
      findMany: topicCertificationFindMany,
      findUnique: topicCertificationFindUnique,
      upsert: topicCertificationUpsert,
    },
    tutorClass: { findMany: tutorClassFindMany },
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
    tutorClassFindMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
  });

  it("attaches usedInClasses when a certification's topic matches one of the tutor's classes", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertificationFindMany.mockResolvedValue([
      { id: "c1", subject: "MATH", topic: "Algebraic Expressions", status: "CERTIFIED" },
    ]);
    tutorClassFindMany.mockResolvedValue([
      {
        id: "cls1",
        subject: "MATH",
        status: "SCHEDULED",
        topics: [{ topic: "Algebraic Expressions" }],
      },
    ]);

    const res = await GET();
    const json = await res.json();
    expect(json[0].usedInClasses).toEqual([{ id: "cls1", subject: "MATH", status: "SCHEDULED" }]);
  });

  it("returns an empty usedInClasses array when no class covers the certified topic", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertificationFindMany.mockResolvedValue([
      { id: "c1", subject: "MATH", topic: "Algebraic Expressions", status: "CERTIFIED" },
    ]);
    tutorClassFindMany.mockResolvedValue([
      { id: "cls1", subject: "SCIENCE", scheduledAt: new Date(), status: "SCHEDULED", topics: [{ topic: "Cells" }] },
    ]);

    const res = await GET();
    const json = await res.json();
    expect(json[0].usedInClasses).toEqual([]);
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

  it("upserts a PENDING certification request when none exists yet", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertificationFindUnique.mockResolvedValue(null);
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
        update: expect.objectContaining({ status: "PENDING", reviewedAt: null, reviewNote: null }),
      })
    );
  });

  it("re-opens a REJECTED certification as PENDING", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertificationFindUnique.mockResolvedValue({ status: "REJECTED" });
    topicCertificationUpsert.mockResolvedValue({ id: "c1", status: "PENDING" });

    const res = await POST(makeRequest({ subject: "MATH", topic: "Algebraic Expressions" }));
    expect(res.status).toBe(201);
    expect(topicCertificationUpsert).toHaveBeenCalled();
  });

  it("does not downgrade a CERTIFIED certification", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertificationFindUnique.mockResolvedValue({ status: "CERTIFIED" });

    const res = await POST(makeRequest({ subject: "MATH", topic: "Algebraic Expressions" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("CERTIFIED");
    expect(topicCertificationUpsert).not.toHaveBeenCalled();
  });
});
