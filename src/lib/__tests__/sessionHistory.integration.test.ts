import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB session history retention", () => {
  let userId: string; let classId: string; let sessionId: string; let testId: string;
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");
    const user = await prisma.user.create({ data: {
      anonymousId: `QA-H-${suffix}`, email: `qa-h-${suffix}@example.test`, firstName: "QA", lastName: "History",
      password: "unused-test-hash", role: "STUDENT_TUTOR", gradeLevel: "GRADE_10", section: "QA",
      tutorProfile: { create: {} },
    }, include: { tutorProfile: true } }); userId = user.id;
    const cls = await prisma.tutorClass.create({ data: {
      code: `QA-H-${suffix}`, tutorProfileId: user.tutorProfile!.id, subject: "MATH", maxStudents: 1,
      sessions: { create: { topic: "History QA", scheduledAt: new Date(Date.now() + 86400000), duration: 60 } },
    }, include: { sessions: true } }); classId = cls.id; sessionId = cls.sessions[0].id;
    testId = (await prisma.sessionTest.create({ data: { sessionId, title: "Retained history", status: "PUBLISHED" } })).id;
    await prisma.sessionTestAttempt.create({ data: { sessionTestId: testId, learnerId: userId, kind: "PRE", totalQuestions: 0, status: "SUBMITTED" } });
  });
  afterAll(async () => {
    if (testId) await prisma.sessionTest.delete({ where: { id: testId } });
    if (classId) await prisma.tutorClass.delete({ where: { id: classId } });
    if (userId) { await prisma.tutorProfile.delete({ where: { userId } }); await prisma.user.delete({ where: { id: userId } }); }
    await prisma.$disconnect();
  });
  it("rejects direct session and cascading class deletes without losing attempts", async () => {
    await expect(prisma.classSession.delete({ where: { id: sessionId } })).rejects.toMatchObject({ code: "P2003" });
    await expect(prisma.tutorClass.delete({ where: { id: classId } })).rejects.toMatchObject({ code: "P2003" });
    expect(await prisma.sessionTestAttempt.count({ where: { sessionTestId: testId } })).toBe(1);
    expect(await prisma.tutorClass.findUnique({ where: { id: classId } })).not.toBeNull();
  });
  it("serializes a delete racing with a newly created test at the foreign key", async () => {
    const s = await prisma.classSession.create({ data: { classId, topic: "Race QA", scheduledAt: new Date(Date.now() + 172800000), duration: 60 } });
    const results = await Promise.allSettled([
      prisma.sessionTest.create({ data: { sessionId: s.id, title: "Race QA" } }),
      prisma.classSession.delete({ where: { id: s.id } }),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const test = await prisma.sessionTest.findUnique({ where: { sessionId: s.id } });
    const session = await prisma.classSession.findUnique({ where: { id: s.id } });
    if (test) { expect(session).not.toBeNull(); await prisma.sessionTest.delete({ where: { id: test.id } }); }
    else expect(session).toBeNull();
  });
});
