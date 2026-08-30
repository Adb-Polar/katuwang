import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, tutorProfileFindUnique, classEnrollmentFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  classEnrollmentFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    classEnrollment: { findMany: classEnrollmentFindMany },
  },
}));

import { GET } from "@/app/api/tutor/students/route";

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/tutor/students${query}`);
}

describe("GET /api/tutor/students", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when no tutor profile exists", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(404);
  });

  it("returns 200 with an empty roster", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classEnrollmentFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ students: [], total: 0, page: 1, pageSize: 10 });
  });

  it("groups multiple enrollments for the same learner into one entry", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classEnrollmentFindMany.mockResolvedValue([
      {
        enrolledAt: new Date("2026-01-02"),
        class: { id: "c2", subject: "SCIENCE", topics: [{ topic: "Cells" }] },
        learner: { id: "l1", anonymousId: "STU-0001", gradeLevel: "GRADE_9", section: "A" },
      },
      {
        enrolledAt: new Date("2026-01-01"),
        class: { id: "c1", subject: "MATH", topics: [{ topic: "Algebra" }] },
        learner: { id: "l1", anonymousId: "STU-0001", gradeLevel: "GRADE_9", section: "A" },
      },
    ]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.students).toHaveLength(1);
    expect(json.students[0].enrollments).toHaveLength(2);
  });

  it("never includes firstName, lastName, or email in the response", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classEnrollmentFindMany.mockResolvedValue([
      {
        enrolledAt: new Date("2026-01-01"),
        class: { id: "c1", subject: "MATH", topics: [{ topic: "Algebra" }] },
        learner: { id: "l1", anonymousId: "STU-0001", gradeLevel: "GRADE_9", section: "A" },
      },
    ]);

    const res = await GET(makeRequest());
    const json = await res.json();
    const raw = JSON.stringify(json);
    expect(raw).not.toMatch(/firstName|lastName|email/i);

    expect(classEnrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          learner: { select: { id: true, anonymousId: true, gradeLevel: true, section: true } },
        }),
      })
    );
  });

  it("applies gradeLevel/section/subject/classId filters to the query", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classEnrollmentFindMany.mockResolvedValue([]);

    await GET(makeRequest("?gradeLevel=GRADE_9&section=A&subject=MATH&classId=c1"));

    expect(classEnrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          class: expect.objectContaining({ tutorProfileId: "tp1", subject: "MATH", id: "c1" }),
          learner: { gradeLevel: "GRADE_9", section: { contains: "A" } },
        }),
      })
    );
  });

  it("matches the q param against the learner's anonymous ID", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classEnrollmentFindMany.mockResolvedValue([]);

    await GET(makeRequest("?q=STU-0007"));

    expect(classEnrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          learner: { anonymousId: { contains: "STU-0007" } },
        }),
      })
    );
  });

  it("paginates the grouped, distinct-learner list", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classEnrollmentFindMany.mockResolvedValue(
      Array.from({ length: 15 }, (_, i) => ({
        enrolledAt: new Date(),
        class: { id: "c1", subject: "MATH", topics: [] },
        learner: { id: `l${i}`, anonymousId: `STU-000${i}`, gradeLevel: "GRADE_9", section: "A" },
      }))
    );

    const res = await GET(makeRequest("?page=2&pageSize=10"));
    const json = await res.json();
    expect(json.total).toBe(15);
    expect(json.students).toHaveLength(5);
    expect(json.page).toBe(2);
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockRejectedValue(new Error("db down"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
