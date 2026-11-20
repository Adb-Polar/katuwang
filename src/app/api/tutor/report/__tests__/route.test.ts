import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { sessionMock, loadOwnedClass, classFindUnique, profileFindUnique } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  loadOwnedClass: vi.fn(),
  classFindUnique: vi.fn(),
  profileFindUnique: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: sessionMock }));
vi.mock("@/lib/sessionTestAccess", () => ({
  loadOwnedClass,
  isAccessError: (x: { error?: string }) => Boolean(x && "error" in x),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { tutorClass: { findUnique: classFindUnique }, tutorProfile: { findUnique: profileFindUnique } },
}));

import { GET } from "@/app/api/tutor/report/route";

const req = (qs: string) => new NextRequest(`http://localhost/api/tutor/report?${qs}`);
const attempts = [
  { learnerId: "L1", kind: "PRE", scorePercent: 50 },
  { learnerId: "L1", kind: "POST", scorePercent: 80 },
  { learnerId: "L2", kind: "PRE", scorePercent: 60 },
];

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ user: { id: "T1", role: "STUDENT_TUTOR" } });
  loadOwnedClass.mockResolvedValue({ tutorProfile: { id: "tp1" }, tutorClass: { id: "c1" } });
  classFindUnique.mockResolvedValue({
    code: "C-0007", subject: "SCIENCE", gradeLevel: "GRADE_9", status: "SCHEDULED", createdAt: new Date(), completedAt: null,
    sessions: [{ topic: "Cells", scheduledAt: new Date("2026-11-03T01:00:00Z"), status: "COMPLETED", test: { status: "CLOSED", attempts } }],
    enrollments: [
      { learnerId: "L2", enrolledAt: new Date("2026-10-01T00:00:00Z"), withdrawnAt: null, learner: { anonymousId: "STU-0002" } },
      { learnerId: "L1", enrolledAt: new Date("2026-10-01T00:00:00Z"), withdrawnAt: null, learner: { anonymousId: "STU-0001" } },
    ],
  });
  profileFindUnique.mockResolvedValue({
    user: { anonymousId: "TUT-0001" },
    classes: [{ code: "C-0007", subject: "SCIENCE", status: "SCHEDULED", enrollments: [{ learnerId: "L1", withdrawnAt: null }], sessions: [{ status: "COMPLETED", test: { status: "CLOSED", attempts } }] }],
    assessmentAttempts: [{ subject: "SCIENCE", topic: "Cells", attemptNo: 1, status: "PASSED", scorePercent: 90, passPercent: 80, submittedAt: new Date() }],
    topicCertifications: [{ subject: "SCIENCE", topic: "Cells", certifiedAt: new Date(), approvalMethod: "ASSESSMENT" }],
  });
});

describe("GET /api/tutor/report", () => {
  it("401 for a non-tutor", async () => {
    sessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
    expect((await GET(req("format=csv"))).status).toBe(401);
  });

  it("400 for a bad scope, a missing classId or a bad format", async () => {
    expect((await GET(req("format=csv&scope=everything"))).status).toBe(400);
    expect((await GET(req("format=csv&scope=class"))).status).toBe(400);
    expect((await GET(req("format=doc"))).status).toBe(400);
  });

  it("passes through the ownership check's status for someone else's class", async () => {
    loadOwnedClass.mockResolvedValue({ error: "Forbidden.", status: 403 });
    const res = await GET(req("format=csv&scope=class&classId=c9"));
    expect(res.status).toBe(403);
    expect(classFindUnique).not.toHaveBeenCalled();
  });

  it("class report lists learners by anonymous ID only, with per-session averages", async () => {
    const res = await GET(req("format=csv&scope=class&classId=c1&from=2026-11-01&to=2026-11-30"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("katuwang-class-report-C-0007_2026-11-01_to_2026-11-30.csv");
    const csv = await res.text();
    expect(csv).toContain("STU-0001");
    expect(csv).toContain('"Sessions","","","Nov 3, 2026","Cells"');
    expect(csv).toContain('"+30"');
    const select = JSON.stringify(classFindUnique.mock.calls[0][0].select);
    expect(select).not.toMatch(/firstName|lastName|email/);
  });

  it("summary report covers classes, quizzes and certified topics", async () => {
    const res = await GET(req("format=csv"));
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain("TUT-0001");
    expect(csv).toContain("Qualification quiz attempts");
    expect(csv).toContain("Certified topics");
    expect(profileFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "T1" } }));
  });

  it("404 when the tutor has no profile", async () => {
    profileFindUnique.mockResolvedValue(null);
    expect((await GET(req("format=csv&scope=summary"))).status).toBe(404);
  });

  it("500 when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    profileFindUnique.mockRejectedValue(new Error("db down"));
    expect((await GET(req("format=pdf"))).status).toBe(500);
  });
});
