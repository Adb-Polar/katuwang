import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as enroll, DELETE as withdraw } from "@/app/api/classes/[classId]/enroll/route";
import { GET as progress } from "@/app/api/learner/progress/route";
import { POST as report } from "@/app/api/learner/reports/route";
import { buildSessionTestResults } from "@/lib/sessionTestResults";
import { loadEnrolledSession, isAccessError } from "@/lib/sessionTestAccess";
const sessions = new AsyncLocalStorage<{ user: { id: string; role: string; anonymousId: string } }>();
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => sessions.getStore() ?? null }));

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB enrollment history", () => {
  const users: string[] = [];let tutorId: string;let classId: string;let sessionId: string;
  const req = (method: string, body?: unknown) => new NextRequest("http://localhost/qa", { method, ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) });
  const ctx = () => ({ params: Promise.resolve({ classId }) });
  const asLearner = <T>(index: number, fn: () => T) => sessions.run({ user: { id: users[index], role: "STUDENT_LEARNER", anonymousId: users[index] } }, fn);
  const join = (index = 1) => asLearner(index, () => enroll(req("POST"), ctx()));
  const leave = (index = 1) => asLearner(index, () => withdraw(req("DELETE"), ctx()));
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");
    for (let i = 0; i < 3; i++) users.push((await prisma.user.create({ data: { anonymousId: `QA-EH-${suffix}-${i}`, email: `qa-eh-${suffix}-${i}@example.test`, firstName: "QA", lastName: "History", password: "unused-test-hash", role: i === 0 ? "STUDENT_TUTOR" : "STUDENT_LEARNER", gradeLevel: "GRADE_10", section: "QA" } })).id);
    tutorId = (await prisma.tutorProfile.create({ data: { userId: users[0] } })).id;
    const cls = await prisma.tutorClass.create({ data: { code: `QA-EH-${suffix}`, tutorProfileId: tutorId, subject: "MATH", maxStudents: 1, published: true, sessions: { create: { topic: "History QA", scheduledAt: new Date(Date.now() + 86400000), duration: 60 } } }, include: { sessions: true } });classId = cls.id;sessionId = cls.sessions[0].id;
  });
  beforeEach(async () => {
    await prisma.report.deleteMany({ where: { classId } });
    await prisma.sessionTest.deleteMany({ where: { sessionId } });
    await prisma.classEnrollment.deleteMany({ where: { classId } });
    await prisma.notification.deleteMany({ where: { userId: { in: users } } });
  });
  afterAll(async () => {
    if (classId) { await prisma.sessionTest.deleteMany({ where: { sessionId } });await prisma.tutorClass.delete({ where: { id: classId } }); }
    if (tutorId) await prisma.tutorProfile.delete({ where: { id: tutorId } });
    if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });await prisma.$disconnect();
  });
  it("retains scores, historical results and reporting eligibility while blocking assessment access", async () => {
    expect((await join()).status).toBe(201);
    const test = await prisma.sessionTest.create({ data: { sessionId, title: "Retained QA scores", status: "PUBLISHED", attempts: { create: { learnerId: users[1], kind: "PRE", status: "SUBMITTED", totalQuestions: 1, correctCount: 1, scorePercent: 100 } } } });
    expect((await leave()).status).toBe(200);
    const enrollment = await prisma.classEnrollment.findUniqueOrThrow({ where: { classId_learnerId: { classId, learnerId: users[1] } } });expect(enrollment.withdrawnAt).not.toBeNull();
    const data = await asLearner(1, async () => (await progress(req("GET"))).json());
    expect(data.series).toHaveLength(1);expect(data.series[0]).toMatchObject({ preScore: 100, withdrawnAt: expect.any(String) });
    const results = await buildSessionTestResults(test.id);
    expect(results!.totals).toMatchObject({ enrolled: 0, historicalEnrolled: 1, preSubmitted: 1 });expect(results!.learners[0].pre).toBe(100);
    const access = await loadEnrolledSession(users[1], classId, sessionId);expect(isAccessError(access) && access.status).toBe(403);
    const reported = await asLearner(1, () => report(req("POST", { targetType: "CLASS", targetId: classId, violations: ["OTHER"], details: "Isolated retained-relationship reporting check." })));
    expect(reported.status).toBe(201);
  });
  it("reactivates the same row and preserves the original enrollment date", async () => {
    const first = await (await join()).json();expect((await leave()).status).toBe(200);
    const again = await (await join()).json();expect(again.id).toBe(first.id);expect(again.enrolledAt).toBe(first.enrolledAt);expect(again.withdrawnAt).toBeNull();
    expect(await prisma.classEnrollment.count({ where: { classId } })).toBe(1);
  });
  it("serializes duplicate withdrawals and sends one dropped notification", async () => {
    await join();
    expect((await Promise.all([leave(), leave()])).map(r => r.status).sort()).toEqual([200, 404]);
    expect(await prisma.notification.count({ where: { userId: users[0], type: "CLASS_ENROLLMENT_DROPPED" } })).toBe(1);
    expect(await prisma.classEnrollment.count({ where: { classId } })).toBe(1);
  });
  it("frees a seat without letting retained history bypass current capacity", async () => {
    await join();await leave();expect((await join(2)).status).toBe(201);expect((await join()).status).toBe(409);
    expect(await prisma.classEnrollment.count({ where: { classId } })).toBe(2);
    expect(await prisma.classEnrollment.count({ where: { classId, withdrawnAt: null } })).toBe(1);
  });
});
