import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classSessionFindUnique,
  sessionTestFindUnique,
  sessionTestAttemptFindUnique,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classSessionFindUnique: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  sessionTestAttemptFindUnique: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classSession: { findUnique: classSessionFindUnique },
    sessionTest: { findUnique: sessionTestFindUnique },
    sessionTestAttempt: { findUnique: sessionTestAttemptFindUnique },
  },
}));

import { GET } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", sessionId: "s1", attemptId: "at1" }) });
const getReq = () =>
  new NextRequest("http://localhost/api/tutor/classes/c1/sessions/s1/test/attempts/at1");

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(tutor);
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", status: "SCHEDULED", subject: "MATH", topics: [] });
  classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "COMPLETED" });
  sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "CLOSED", questions: [], _count: { attempts: 1 } });
});

describe("GET /test/attempts/[attemptId] (tutor)", () => {
  it("404 when the attempt belongs to a different test", async () => {
    sessionTestAttemptFindUnique.mockResolvedValue({ id: "at1", sessionTestId: "OTHER" });
    const res = await GET(getReq(), ctx());
    expect(res.status).toBe(404);
  });

  it("exposes only the learner's anonymousId, never their id (double-blind)", async () => {
    sessionTestAttemptFindUnique.mockResolvedValue({
      id: "at1",
      sessionTestId: "st1",
      kind: "POST",
      status: "SUBMITTED",
      totalQuestions: 1,
      correctCount: 1,
      scorePercent: 100,
      startedAt: new Date(),
      submittedAt: new Date(),
      sessionTest: { id: "st1", title: "t", instructions: null },
      learner: { anonymousId: "STU-0001" },
      items: [],
    });
    const res = await GET(getReq(), ctx());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.learner).toEqual({ anonymousId: "STU-0001" });
    expect(json.learner).not.toHaveProperty("id");
  });
});
