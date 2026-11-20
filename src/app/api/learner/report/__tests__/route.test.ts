import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { sessionMock, userFindUnique, enrollmentFindMany, certFindMany } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  userFindUnique: vi.fn(),
  enrollmentFindMany: vi.fn(),
  certFindMany: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: sessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    classEnrollment: { findMany: enrollmentFindMany },
    completionCertificate: { findMany: certFindMany },
  },
}));

import { GET } from "@/app/api/learner/report/route";

const req = (qs: string) => new NextRequest(`http://localhost/api/learner/report?${qs}`);

const enrollment = {
  withdrawnAt: null,
  class: {
    code: "C-0001", subject: "MATH", status: "COMPLETED",
    sessions: [{
      id: "s1", topic: "Fractions", scheduledAt: new Date("2026-11-01T02:00:00Z"), status: "COMPLETED",
      test: { status: "CLOSED", attempts: [
        { kind: "PRE", scorePercent: 40, status: "SUBMITTED" },
        { kind: "POST", scorePercent: 70, status: "SUBMITTED" },
      ] },
    }],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
  userFindUnique.mockResolvedValue({ anonymousId: "STU-0001", gradeLevel: "GRADE_8", section: "Rizal" });
  enrollmentFindMany.mockResolvedValue([enrollment]);
  certFindMany.mockResolvedValue([{ certificateNumber: "KTW-1", classCode: "C-0001", subjectName: "Mathematics", completedAt: new Date("2026-11-10T00:00:00Z") }]);
});

describe("GET /api/learner/report", () => {
  it("401 without a learner session", async () => {
    sessionMock.mockResolvedValue({ user: { id: "T1", role: "STUDENT_TUTOR" } });
    expect((await GET(req("format=csv"))).status).toBe(401);
    sessionMock.mockResolvedValue(null);
    expect((await GET(req("format=csv"))).status).toBe(401);
  });

  it("400 for a bad format or range", async () => {
    expect((await GET(req("format=xlsx"))).status).toBe(400);
    expect((await GET(req("format=csv&from=2026-11-05&to=2026-11-01"))).status).toBe(400);
  });

  it("404 when filtering by a class the learner never joined", async () => {
    enrollmentFindMany.mockResolvedValue([]);
    expect((await GET(req("format=csv&classId=other"))).status).toBe(404);
  });

  it("returns a CSV attachment with the learner's own scores and no tutor identity", async () => {
    const res = await GET(req("format=csv&from=2026-11-01&to=2026-11-30"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="katuwang-progress-STU-0001_2026-11-01_to_2026-11-30.csv"');
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const csv = await res.text();
    expect(csv).toContain("Fractions");
    expect(csv).toContain('"+30"');
    expect(csv).toContain("KTW-1");
    // Certificates are read without tutorName; enrollments never select tutor.
    expect(certFindMany.mock.calls[0][0].select).not.toHaveProperty("tutorName");
    expect(JSON.stringify(enrollmentFindMany.mock.calls[0][0].select)).not.toMatch(/tutor|firstName|lastName|email/);
  });

  it("filters sessions and certificates by the date range", async () => {
    await GET(req("format=csv&from=2026-11-01&to=2026-11-30"));
    const window = { gte: new Date("2026-10-31T16:00:00Z"), lt: new Date("2026-11-30T16:00:00Z") };
    expect(enrollmentFindMany.mock.calls[0][0].select.class.select.sessions.where).toEqual({ scheduledAt: window });
    expect(certFindMany.mock.calls[0][0].where).toEqual({ learnerId: "L1", issuedAt: window });
  });

  it("returns a PDF", async () => {
    const res = await GET(req("format=pdf"));
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("500 when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    enrollmentFindMany.mockRejectedValue(new Error("db down"));
    expect((await GET(req("format=csv"))).status).toBe(500);
  });
});
