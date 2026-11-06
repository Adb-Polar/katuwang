vi.mock("@/lib/teachingBankAccess", () => ({
  certifiedBankTopics: vi.fn().mockResolvedValue([{ subject: "MATH", topic: "Fractions" }]),
  certifiedBankWhere: (topics: { subject: string; topic: string }[]) => ({ OR: topics }),
}));
import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classSessionFindUnique,
  sessionTestFindUnique,
  classEnrollmentFindUnique,
  getSettingMock,
} = vi.hoisted(() => ({
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classSessionFindUnique: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  classEnrollmentFindUnique: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classSession: { findUnique: classSessionFindUnique },
    sessionTest: { findUnique: sessionTestFindUnique },
    classEnrollment: { findUnique: classEnrollmentFindUnique },
  },
}));

vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));

import {
  checkLearnerAttemptAccess,
  isAccessError,
  loadOwnedClass,
  loadOwnedSession,
  loadEnrolledSession,
} from "@/lib/sessionTestAccess";

beforeEach(() => {
  vi.clearAllMocks();
  getSettingMock.mockResolvedValue(true);
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({
    id: "c1",
    tutorProfileId: "tp1",
    status: "SCHEDULED",
    subject: "MATH",
    topics: [{ topic: "Fractions" }],
  });
  classSessionFindUnique.mockResolvedValue({
    id: "s1",
    classId: "c1",
    status: "SCHEDULED",
    scheduledAt: new Date(),
    topic: "Fractions",
  });
  sessionTestFindUnique.mockResolvedValue(null);
  classEnrollmentFindUnique.mockResolvedValue({ id: "e1" });
});

describe("loadOwnedClass", () => {
  it("404 when the tutor has no profile", async () => {
    tutorProfileFindUnique.mockResolvedValue(null);
    const r = await loadOwnedClass("U1", "c1");
    expect(isAccessError(r) && r.status).toBe(404);
  });

  it("403 when the class belongs to another tutor", async () => {
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "OTHER", status: "SCHEDULED" });
    const r = await loadOwnedClass("U1", "c1");
    expect(isAccessError(r) && r.status).toBe(403);
  });

  it("403 when the class is SUSPENDED or BANNED", async () => {
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", status: "BANNED" });
    const r = await loadOwnedClass("U1", "c1");
    expect(isAccessError(r) && r.status).toBe(403);
  });

  it("returns the tutor profile + class on success", async () => {
    const r = await loadOwnedClass("U1", "c1");
    expect(isAccessError(r)).toBe(false);
  });
});

describe("loadOwnedSession", () => {
  it("404 when the session doesn't belong to the class", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "OTHER", status: "SCHEDULED" });
    const r = await loadOwnedSession("U1", "c1", "s1");
    expect(isAccessError(r) && r.status).toBe(404);
  });

  it("returns a null test when none exists yet", async () => {
    const r = await loadOwnedSession("U1", "c1", "s1");
    expect(isAccessError(r)).toBe(false);
    if (!isAccessError(r)) expect(r.test).toBeNull();
  });
});

describe("loadEnrolledSession", () => {
  it("403 when the learner is not enrolled", async () => {
    classEnrollmentFindUnique.mockResolvedValue(null);
    const r = await loadEnrolledSession("L1", "c1", "s1");
    expect(isAccessError(r) && r.status).toBe(403);
  });

  it("403 when the class is under moderation, even if enrolled", async () => {
    tutorClassFindUnique.mockResolvedValue({ id: "c1", status: "SUSPENDED" });
    const r = await loadEnrolledSession("L1", "c1", "s1");
    expect(isAccessError(r) && r.status).toBe(403);
  });

  it("404 when the session isn't in the class", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "OTHER", status: "SCHEDULED" });
    const r = await loadEnrolledSession("L1", "c1", "s1");
    expect(isAccessError(r) && r.status).toBe(404);
  });

  it("succeeds for an enrolled learner in an active class", async () => {
    const r = await loadEnrolledSession("L1", "c1", "s1");
    expect(isAccessError(r)).toBe(false);
  });
});

import { certifiedBankTopics } from "@/lib/teachingBankAccess";
describe("linked qualification-bank confidentiality", () => {
  const linked = { id: "st1", questions: [{ question: { origin: "BANK", subject: "SCIENCE", topic: "Cells" } }] };
  it("blocks legacy linked questions outside exact certified subject/topic", async () => {
    sessionTestFindUnique.mockResolvedValue(linked);
    const result = await loadOwnedSession("U1", "c1", "s1");
    expect(isAccessError(result) && result.status).toBe(403);
  });
  it("allows linked bank questions for a certified topic", async () => {
    sessionTestFindUnique.mockResolvedValue(linked);
    vi.mocked(certifiedBankTopics).mockResolvedValueOnce([{ subject: "SCIENCE", topic: "Cells" }]);
    expect(isAccessError(await loadOwnedSession("U1", "c1", "s1"))).toBe(false);
  });
  it("keeps custom-question authoring accessible without a certification", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", questions: [{ question: { origin: "TUTOR" } }] });
    vi.mocked(certifiedBankTopics).mockResolvedValueOnce([]);
    expect(isAccessError(await loadOwnedSession("U1", "c1", "s1"))).toBe(false);
    expect(certifiedBankTopics).not.toHaveBeenCalled();
    vi.mocked(certifiedBankTopics).mockReset().mockResolvedValue([{ subject: "MATH", topic: "Fractions" }]);
  });
});


describe("current learner attempt access", () => {
  const attempt = { sessionTestId: "st1", kind: "PRE" as const, status: "IN_PROGRESS" as const, startedAt: new Date(Date.now() - 60_000) };
  beforeEach(() => sessionTestFindUnique.mockResolvedValue({
    id: "st1", sessionId: "s1", session: { classId: "c1" }, status: "PUBLISHED", closedAt: null, pretestClosedAt: null,
  }));
  it("allows a currently enrolled learner", async () => {
    expect(await checkLearnerAttemptAccess("L1", attempt)).toBeNull();
  });
  it("rejects after tests are disabled before reading questions", async () => {
    getSettingMock.mockResolvedValue(false);
    expect(await checkLearnerAttemptAccess("L1", attempt)).toMatchObject({ status: 403 });
    expect(sessionTestFindUnique).not.toHaveBeenCalled();
  });
  it("rejects after withdrawal", async () => {
    classEnrollmentFindUnique.mockResolvedValue(null);
    expect(await checkLearnerAttemptAccess("L1", attempt)).toMatchObject({ status: 403 });
  });
  it.each(["SUSPENDED", "BANNED", "CANCELLED"])("rejects a class that is now %s", async (status) => {
    tutorClassFindUnique.mockResolvedValue({ id: "c1", status });
    expect(await checkLearnerAttemptAccess("L1", attempt)).toMatchObject({ status: 403 });
  });
  it("rejects cancelled sessions", async () => {
    classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "CANCELLED" });
    expect(await checkLearnerAttemptAccess("L1", attempt)).toMatchObject({ status: 409 });
  });
  it("allows ordinary closure within grace", async () => {
    sessionTestFindUnique.mockResolvedValue({ sessionId: "s1", session: { classId: "c1" }, status: "CLOSED", closedAt: new Date(), pretestClosedAt: null });
    expect(await checkLearnerAttemptAccess("L1", attempt)).toBeNull();
  });
  it("rejects ordinary closure after grace", async () => {
    sessionTestFindUnique.mockResolvedValue({ sessionId: "s1", session: { classId: "c1" }, status: "CLOSED", closedAt: new Date(Date.now() - 16 * 60_000), pretestClosedAt: null });
    expect(await checkLearnerAttemptAccess("L1", attempt)).toMatchObject({ status: 409 });
  });
});
