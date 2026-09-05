import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classSessionFindUnique,
  sessionTestFindUnique,
  classEnrollmentFindUnique,
} = vi.hoisted(() => ({
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classSessionFindUnique: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  classEnrollmentFindUnique: vi.fn(),
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

import {
  isAccessError,
  loadOwnedClass,
  loadOwnedSession,
  loadEnrolledSession,
} from "@/lib/sessionTestAccess";

beforeEach(() => {
  vi.clearAllMocks();
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
