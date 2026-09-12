import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  classFindMany,
  classCreate,
  sessionFindMany,
  topicCertificationFindMany,
  getSettingMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  classFindMany: vi.fn(),
  classCreate: vi.fn(),
  sessionFindMany: vi.fn(),
  topicCertificationFindMany: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findMany: classFindMany, create: classCreate },
    classSession: { findMany: sessionFindMany },
    topicCertification: { findMany: topicCertificationFindMany },
  },
}));

vi.mock("@/lib/settings", () => ({
  getSetting: getSettingMock,
}));

vi.mock("@/lib/idGenerator", () => ({
  generateClassCode: vi.fn().mockResolvedValue("C-0001"),
}));

import { GET, POST } from "@/app/api/tutor/classes/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validSession = { topic: "Algebraic Expressions", scheduledAt: new Date(Date.now() + 86_400_000).toISOString(), duration: 60 };

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    subject: "MATH",
    topics: ["Algebraic Expressions"],
    maxStudents: 2,
    sessions: [validSession],
    meetingLink: "https://meet.google.com/abc-defg-hij",
    ...overrides,
  };
}

describe("GET /api/tutor/classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET(new NextRequest("http://localhost/api/tutor/classes"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no tutor profile exists", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/tutor/classes"));
    expect(res.status).toBe(404);
  });

  it("returns 200 with sessions included in each class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindMany.mockResolvedValue([
      {
        id: "c1",
        topics: [{ topic: "Algebraic Expressions" }],
        sessions: [{ id: "s1", topic: "Algebraic Expressions", status: "SCHEDULED" }],
        enrollments: [],
      },
    ]);

    const res = await GET(new NextRequest("http://localhost/api/tutor/classes"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].sessions).toEqual([{ id: "s1", topic: "Algebraic Expressions", status: "SCHEDULED" }]);
    expect(json[0].topics).toEqual(["Algebraic Expressions"]);
  });
});

describe("POST /api/tutor/classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(false);
    sessionFindMany.mockResolvedValue([]);
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no tutor profile exists", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(404);
  });

  it("returns 400 for a missing sessions array", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const { sessions: _sessions, ...rest } = validBody();
    const res = await POST(makeRequest(rest));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an empty sessions array", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await POST(makeRequest(validBody({ sessions: [] })));
    expect(res.status).toBe(400);
  });

  it("accepts a custom topic that isn't in the curated list", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classCreate.mockResolvedValue({ id: "c1", topics: [], sessions: [] });

    const res = await POST(
      makeRequest(
        validBody({
          topics: ["Competitive Math Olympiad Prep"],
          sessions: [{ ...validSession, topic: "  competitive math   olympiad prep " }],
        })
      )
    );
    expect(res.status).toBe(201);
    expect(classCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          topics: { create: [{ topic: "Competitive Math Olympiad Prep" }] },
          // the session topic is normalized to the canonical class topic
          sessions: { create: [expect.objectContaining({ topic: "Competitive Math Olympiad Prep" })] },
        }),
      })
    );
  });

  it("returns 400 for a topic shorter than 2 characters", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await POST(makeRequest(validBody({ topics: ["x"] })));
    expect(res.status).toBe(400);
  });

  it("still blocks an uncertified custom topic when certification is required", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    getSettingMock.mockResolvedValue(true);
    topicCertificationFindMany.mockResolvedValue([]);
    const res = await POST(
      makeRequest(
        validBody({
          topics: ["Brand New Custom Topic"],
          sessions: [{ ...validSession, topic: "Brand New Custom Topic" }],
        })
      )
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/not certified/i);
  });

  it("returns 400 when a session's topic isn't one of the class's topics", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await POST(
      makeRequest(
        validBody({
          topics: ["Algebraic Expressions"],
          sessions: [{ ...validSession, topic: "Fractions & Decimals" }],
        })
      )
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/one of the class's selected topics/i);
  });

  it("returns 400 when the tutor isn't certified and certification is required", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    getSettingMock.mockResolvedValue(true);
    topicCertificationFindMany.mockResolvedValue([]);
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/not certified/i);
  });

  it("returns 400 for a session scheduled in the past", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await POST(
      makeRequest(validBody({ sessions: [{ ...validSession, scheduledAt: new Date(Date.now() - 3600_000).toISOString() }] }))
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/past/i);
  });

  it("returns 409 when two submitted sessions overlap each other", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const start = new Date(Date.now() + 86_400_000).toISOString();
    const res = await POST(
      makeRequest(
        validBody({
          topics: ["Algebraic Expressions", "Fractions & Decimals"],
          sessions: [
            { topic: "Algebraic Expressions", scheduledAt: start, duration: 60 },
            { topic: "Fractions & Decimals", scheduledAt: start, duration: 60 },
          ],
        })
      )
    );
    expect(res.status).toBe(409);
    expect(classCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when a session overlaps an existing session in another class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    sessionFindMany.mockResolvedValue([
      { scheduledAt: new Date(validSession.scheduledAt), duration: 60 },
    ]);
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(409);
    expect(classCreate).not.toHaveBeenCalled();
  });

  it("creates the class with its sessions on success", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classCreate.mockResolvedValue({
      id: "c1",
      topics: [{ topic: "Algebraic Expressions" }],
      sessions: [{ id: "s1", topic: "Algebraic Expressions", status: "SCHEDULED" }],
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.topics).toEqual(["Algebraic Expressions"]);
    expect(classCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tutorProfileId: "tp1",
          code: "C-0001",
          subject: "MATH",
          sessions: { create: [expect.objectContaining({ topic: "Algebraic Expressions" })] },
        }),
      })
    );
  });

  it("persists an optional target gradeLevel", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classCreate.mockResolvedValue({ id: "c1", topics: [], sessions: [] });

    await POST(makeRequest(validBody({ gradeLevel: "GRADE_9" })));
    expect(classCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ gradeLevel: "GRADE_9" }) })
    );
  });

  it("defaults gradeLevel to null when omitted", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classCreate.mockResolvedValue({ id: "c1", topics: [], sessions: [] });

    await POST(makeRequest(validBody()));
    expect(classCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ gradeLevel: null }) })
    );
  });

  it("creates a class with multiple non-overlapping sessions", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classCreate.mockResolvedValue({ id: "c1", topics: [], sessions: [] });

    const res = await POST(
      makeRequest(
        validBody({
          topics: ["Algebraic Expressions", "Fractions & Decimals"],
          sessions: [
            validSession,
            { topic: "Fractions & Decimals", scheduledAt: new Date(Date.now() + 172_800_000).toISOString(), duration: 60 },
          ],
        })
      )
    );
    expect(res.status).toBe(201);
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(500);
  });
});
