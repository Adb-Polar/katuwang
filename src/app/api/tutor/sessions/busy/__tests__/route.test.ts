import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, tutorProfileFindUnique, sessionFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  sessionFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    classSession: { findMany: sessionFindMany },
  },
}));

import { GET } from "@/app/api/tutor/sessions/busy/route";

const tutorSession = { user: { id: "u1", role: "STUDENT_TUTOR" } };

describe("GET /api/tutor/sessions/busy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(tutorSession);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    sessionFindMany.mockResolvedValue([]);
  });

  it("returns 401 when not signed in", async () => {
    getServerSessionMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("returns 401 for a learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u2", role: "STUDENT_LEARNER" } });
    expect((await GET()).status).toBe(401);
  });

  it("returns 404 when the tutor profile is missing", async () => {
    tutorProfileFindUnique.mockResolvedValue(null);
    expect((await GET()).status).toBe(404);
  });

  it("flattens the class code onto each slot", async () => {
    const scheduledAt = new Date("2026-12-02T09:00:00.000Z");
    sessionFindMany.mockResolvedValue([
      { id: "s1", scheduledAt, duration: 60, topic: "Algebra", class: { code: "C-0012" } },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: "s1", scheduledAt: scheduledAt.toISOString(), duration: 60, topic: "Algebra", classCode: "C-0012" },
    ]);
  });

  it("only asks for the tutor's own scheduled sessions in scheduled classes", async () => {
    await GET();
    expect(sessionFindMany.mock.calls[0][0].where).toMatchObject({
      status: "SCHEDULED",
      class: { tutorProfileId: "tp1", status: "SCHEDULED" },
    });
  });

  it("returns 500 when the query fails", async () => {
    sessionFindMany.mockRejectedValue(new Error("db down"));
    expect((await GET()).status).toBe(500);
  });
});
