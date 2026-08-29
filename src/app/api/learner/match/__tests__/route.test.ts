import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, getSettingMock, reinstateMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  getSettingMock: vi.fn(),
  reinstateMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({ prisma: { tutorClass: { findMany: findManyMock } } }));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));
vi.mock("@/lib/moderation", () => ({ reinstateExpiredClasses: reinstateMock }));

import { POST } from "@/app/api/learner/match/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/learner/match", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = { subject: "MATH", topics: ["Algebraic Expressions"] };

describe("POST /api/learner/match", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(true);
    reinstateMock.mockResolvedValue(undefined);
  });

  it("returns 401 for a non-learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 403 when matching is disabled", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    getSettingMock.mockResolvedValue(false);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid topic in the subject", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await POST(makeRequest({ subject: "MATH", topics: ["Not A Real Topic"] }));
    expect(res.status).toBe(400);
  });

  it("returns ranked matches with reasons", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    findManyMock.mockResolvedValue([
      {
        id: "c1",
        subject: "MATH",
        gradeLevel: null,
        status: "SCHEDULED",
        published: true,
        maxStudents: 3,
        topics: [{ topic: "Algebraic Expressions" }],
        sessions: [
          { id: "s1", topic: "Algebraic Expressions", scheduledAt: new Date(Date.now() + 3 * 86400_000), duration: 60, status: "SCHEDULED" },
        ],
        tutorProfile: {
          id: "tp1",
          user: { id: "t1", anonymousId: "TUT-0001" },
          topicCertifications: [{ subject: "MATH", topic: "Algebraic Expressions" }],
        },
        _count: { enrollments: 0 },
        enrollments: [],
      },
    ]);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.matches).toHaveLength(1);
    expect(json.matches[0].class.id).toBe("c1");
    expect(json.matches[0].reasons.matchedTopics).toEqual(["Algebraic Expressions"]);
    expect(json.matches[0].reasons.verifiedMatchedTopics).toEqual(["Algebraic Expressions"]);
    expect(json.matches[0].score).toBeGreaterThan(0);
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    findManyMock.mockRejectedValue(new Error("DB down"));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });
});
