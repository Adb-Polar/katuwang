vi.mock("@/lib/teachingBankAccess", () => ({
  certifiedBankTopics: vi.fn().mockResolvedValue([{ subject: "MATH", topic: "Fractions" }]),
  certifiedBankWhere: (topics: { subject: string; topic: string }[]) => ({ OR: topics }),
}));
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const {
  getServerSessionMock,
  platformSettingFindUnique,
  tutorClassFindUnique,
  classEnrollmentFindUnique,
  classSessionFindUnique,
  sessionTestFindUnique,
  sessionTestAttemptFindUnique,
  sessionTestAttemptCreate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  platformSettingFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classEnrollmentFindUnique: vi.fn(),
  classSessionFindUnique: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  sessionTestAttemptFindUnique: vi.fn(),
  sessionTestAttemptCreate: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformSetting: { findUnique: platformSettingFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classEnrollment: { findUnique: classEnrollmentFindUnique },
    classSession: { findUnique: classSessionFindUnique },
    sessionTest: { findUnique: sessionTestFindUnique },
    sessionTestAttempt: { findUnique: sessionTestAttemptFindUnique, create: sessionTestAttemptCreate },
  },
}));

import { POST } from "@/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };
const ctx = (kind = "PRE") => ({ params: Promise.resolve({ classId: "c1", sessionId: "s1", kind }) });
const req = () => new NextRequest("http://localhost/x", { method: "POST" });

const attemptItems = () => ({
  items: { include: { question: { include: { options: true } } } },
  sessionTest: { select: { id: true, title: true, instructions: true } },
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(learner);
  platformSettingFindUnique.mockResolvedValue(null); // sessionTestsEnabled defaults to true
  tutorClassFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
  classEnrollmentFindUnique.mockResolvedValue({ id: "e1" });
  classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "SCHEDULED" });
  sessionTestFindUnique.mockResolvedValue({
    id: "st1",
    status: "PUBLISHED",
    questions: [{ questionId: "q1", position: 0 }],
  });
  sessionTestAttemptFindUnique.mockResolvedValue(null);
});

describe("POST /test/[kind]/start — the §2 ladder", () => {
  it("401 wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_TUTOR" } });
    expect((await POST(req(), ctx())).status).toBe(401);
  });

  it("403 flag off", async () => {
    platformSettingFindUnique.mockResolvedValue({ value: "false" });
    expect((await POST(req(), ctx())).status).toBe(403);
  });

  it("404 bad kind", async () => {
    expect((await POST(req(), ctx("MIDTERM"))).status).toBe(404);
  });

  it("404 class not found", async () => {
    tutorClassFindUnique.mockResolvedValue(null);
    expect((await POST(req(), ctx())).status).toBe(404);
  });

  it("403 not enrolled", async () => {
    classEnrollmentFindUnique.mockResolvedValue(null);
    expect((await POST(req(), ctx())).status).toBe(403);
  });

  it("403 class SUSPENDED/BANNED", async () => {
    tutorClassFindUnique.mockResolvedValue({ id: "c1", status: "BANNED" });
    expect((await POST(req(), ctx())).status).toBe(403);
  });

  it("404 session not in class", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "OTHER", status: "SCHEDULED" });
    expect((await POST(req(), ctx())).status).toBe(404);
  });

  it("404 test is DRAFT (indistinguishable from absent)", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [] });
    expect((await POST(req(), ctx())).status).toBe(404);
  });

  it("409 CLOSED", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "CLOSED", questions: [] });
    expect((await POST(req(), ctx())).status).toBe(409);
  });

  it("409 when the tutor has not posted the post-test", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "SCHEDULED" });
    const res = await POST(req(), ctx("POST"));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("POST_NOT_OPEN");
  });

  it("keeps the post-test closed after session completion until the tutor posts it", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "COMPLETED" });
    const res = await POST(req(), ctx("POST"));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("POST_NOT_OPEN");
  });

  it("409 per the gating table — PRE window closed once the session is COMPLETED", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "COMPLETED" });
    const res = await POST(req(), ctx("PRE"));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("PRE_WINDOW_CLOSED");
  });

  it("409 for a new PRE attempt after the tutor closes the pre-test", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "PUBLISHED", pretestClosedAt: new Date(), questions: [{ questionId: "q1", position: 0 }] });
    const res = await POST(req(), ctx("PRE"));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("PRE_WINDOW_CLOSED");
    expect(sessionTestAttemptCreate).not.toHaveBeenCalled();
  });

  it("allows a new POST attempt once posted even while the session is scheduled", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "PUBLISHED", pretestClosedAt: new Date(), posttestOpenedAt: new Date(), questions: [{ questionId: "q1", position: 0 }] });
    sessionTestAttemptCreate.mockResolvedValue({
      id: "at-post", kind: "POST", status: "IN_PROGRESS", totalQuestions: 1,
      correctCount: 0, scorePercent: 0, startedAt: new Date(), submittedAt: null,
      sessionTest: { id: "st1", title: "t", instructions: null }, items: [],
    });
    const res = await POST(req(), ctx("POST"));
    expect(res.status).toBe(201);
  });

  it("409 per the gating table — no new starts once the session is CANCELLED", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "CANCELLED" });
    const res = await POST(req(), ctx("PRE"));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("SESSION_CANCELLED");
  });

  it("409 already SUBMITTED", async () => {
    sessionTestAttemptFindUnique.mockResolvedValue({ status: "SUBMITTED", ...attemptItems() });
    expect((await POST(req(), ctx())).status).toBe(409);
  });

  it("200 resume — an existing PRE attempt has 15 minutes after closure", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "COMPLETED" });
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "PUBLISHED", pretestClosedAt: new Date(Date.now() + 1000), questions: [] });
    sessionTestAttemptFindUnique.mockResolvedValue({
      id: "at1",
      kind: "PRE",
      status: "IN_PROGRESS",
      totalQuestions: 1,
      correctCount: 0,
      scorePercent: 0,
      startedAt: new Date(),
      submittedAt: null,
      sessionTest: { id: "st1", title: "t", instructions: null },
      items: [],
    });
    const res = await POST(req(), ctx("PRE"));
    expect(res.status).toBe(200);
    expect(sessionTestAttemptCreate).not.toHaveBeenCalled();
  });

  it("201 create — a fresh PRE attempt while the session is SCHEDULED", async () => {
    sessionTestAttemptCreate.mockResolvedValue({
      id: "at1",
      kind: "PRE",
      status: "IN_PROGRESS",
      totalQuestions: 1,
      correctCount: 0,
      scorePercent: 0,
      startedAt: new Date(),
      submittedAt: null,
      sessionTest: { id: "st1", title: "t", instructions: null },
      items: [],
    });
    const res = await POST(req(), ctx("PRE"));
    expect(res.status).toBe(201);
    expect(sessionTestAttemptCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ learnerId: "L1", kind: "PRE" }) }),
    );
  });

  it("200 resume — a concurrent start that loses the unique-constraint race returns the winner's attempt instead of erroring", async () => {
    const raceWinner = {
      id: "at1",
      kind: "PRE",
      status: "IN_PROGRESS",
      totalQuestions: 1,
      correctCount: 0,
      scorePercent: 0,
      startedAt: new Date(),
      submittedAt: null,
      sessionTest: { id: "st1", title: "t", instructions: null },
      items: [],
    };
    sessionTestAttemptCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    // First lookup (before create) finds nothing; second lookup (after the race
    // loss) finds the attempt the concurrent request just created.
    sessionTestAttemptFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(raceWinner);

    const res = await POST(req(), ctx("PRE"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("at1");
  });
});
