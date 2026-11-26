import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, sessionFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  sessionFindMany: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({ prisma: { classSession: { findMany: sessionFindMany } } }));

import { GET } from "@/app/api/tutor/schedule/route";

const tutor = { user: { id: "u1", role: "STUDENT_TUTOR" } };

describe("GET /api/tutor/schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it.each(["STUDENT_LEARNER", "ADMIN"])("returns 401 for a %s", async (role) => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u2", role } });
    expect((await GET()).status).toBe(401);
    expect(sessionFindMany).not.toHaveBeenCalled();
  });

  it("returns the tutor's sessions labelled by subject and class code", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionFindMany.mockResolvedValue([
      { id: "s1", scheduledAt: new Date("2026-12-02T07:00:00.000Z"), duration: 90, class: { code: "C-0002", subject: "MATH" } },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const { sessions } = await res.json();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ id: "s1", scheduledAt: "2026-12-02T07:00:00.000Z", duration: 90 });
    expect(sessions[0].label).toMatch(/ · C-0002$/);
  });

  it("only asks for this tutor's scheduled sessions in active classes", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionFindMany.mockResolvedValue([]);
    await GET();
    const { where } = sessionFindMany.mock.calls[0][0];
    expect(where.status).toBe("SCHEDULED");
    expect(where.class).toEqual({ tutorProfile: { userId: "u1" }, status: { notIn: ["CANCELLED", "COMPLETED"] } });
  });

  it("returns 500 when the query fails", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionFindMany.mockRejectedValue(new Error("db down"));
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("An unexpected error occurred. Please try again.");
  });
});
