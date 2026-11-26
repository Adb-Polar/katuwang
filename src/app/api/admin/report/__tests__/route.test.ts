import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({
  session: vi.fn(),
  groupBy: vi.fn(),
  count: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: m.session }));
vi.mock("@/lib/prisma", () => {
  const model = { groupBy: m.groupBy, count: m.count, findMany: m.findMany };
  return { prisma: { user: model, tutorClass: model, topicCertification: model, classEnrollment: model, classSession: model, sessionTestAttempt: model, sessionTest: model, auditLog: model } };
});

import { GET } from "@/app/api/admin/report/route";

const req = (qs: string) => new NextRequest(`http://localhost/api/admin/report?${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
  m.session.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
  m.groupBy.mockResolvedValue([]);
  m.count.mockResolvedValue(0);
  m.findMany.mockResolvedValue([]);
});

describe("GET /api/admin/report", () => {
  it("401 for non-admins", async () => {
    m.session.mockResolvedValue({ user: { id: "T1", role: "STUDENT_TUTOR" } });
    expect((await GET(req("format=csv"))).status).toBe(401);
  });

  it("400 for an unknown scope", async () => {
    expect((await GET(req("format=csv&scope=passwords"))).status).toBe(400);
  });

  it("overview PDF for a super admin", async () => {
    m.session.mockResolvedValue({ user: { id: "S1", role: "SUPER_ADMIN" } });
    const res = await GET(req("format=pdf"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("users export filters by registration date and includes real identity for admins", async () => {
    m.count.mockResolvedValue(1);
    m.findMany.mockResolvedValue([{ anonymousId: "STU-0001", firstName: "Juan", lastName: "Cruz", email: "j@x.ph", role: "STUDENT_LEARNER", gradeLevel: "GRADE_7", section: "A", status: "ACTIVE", createdAt: new Date("2026-11-02T00:00:00Z") }]);
    const res = await GET(req("format=csv&scope=users&from=2026-11-01&to=2026-11-30"));
    expect(res.headers.get("Content-Disposition")).toContain("katuwang-admin-users_2026-11-01_to_2026-11-30.csv");
    const csv = await res.text();
    expect(csv).toContain("Juan Cruz");
    expect(m.findMany.mock.calls[0][0].where).toEqual({ createdAt: { gte: new Date("2026-10-31T16:00:00Z"), lt: new Date("2026-11-30T16:00:00Z") } });
    expect(m.findMany.mock.calls[0][0].take).toBe(5000);
  });

  it("flags truncated exports", async () => {
    m.session.mockResolvedValue({ user: { id: "S1", role: "SUPER_ADMIN" } });
    m.count.mockResolvedValue(6000);
    const csv = await (await GET(req("format=csv&scope=audit-log"))).text();
    expect(csv).toContain("Showing the first 5000 of 6000 records");
    expect(m.findMany.mock.calls[0][0].take).toBe(5000);
  });

  it.each(["classes", "enrollments", "session-tests", "certifications"])("%s export renders", async (scope) => {
    expect((await GET(req(`format=csv&scope=${scope}`))).status).toBe(200);
  });

  it("refuses the audit-log export to a standard admin", async () => {
    const res = await GET(req("format=csv&scope=audit-log"));
    expect(res.status).toBe(403);
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it("renders the audit-log export for the super admin", async () => {
    m.session.mockResolvedValue({ user: { id: "S1", role: "SUPER_ADMIN" } });
    expect((await GET(req("format=csv&scope=audit-log"))).status).toBe(200);
  });

  it("500 when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    m.groupBy.mockRejectedValue(new Error("db down"));
    expect((await GET(req("format=csv"))).status).toBe(500);
  });
});
