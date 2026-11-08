import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as enroll } from "@/app/api/classes/[classId]/enroll/route";
import { PATCH as editClass } from "@/app/api/tutor/classes/[classId]/route";

const sessions = new AsyncLocalStorage<{ user: { id: string; role: string; anonymousId: string; gradeLevel: string } }>();
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => sessions.getStore() ?? null }));

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB enrollment serialization", () => {
  let classId: string;
  let tutorId: string;
  const learnerIds: string[] = [];
  const userIds: string[] = [];
  const asUser = <T>(id: string, role: string, fn: () => T) => sessions.run({ user: { id, role, anonymousId: id, gradeLevel: "GRADE_10" } }, fn);
  const attempt = (id: string) => asUser(id, "STUDENT_LEARNER", () => enroll(
    new NextRequest(`http://localhost/api/classes/${classId}/enroll`, { method: "POST" }),
    { params: Promise.resolve({ classId }) },
  ));
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL ||
        !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) {
      throw new Error("Use an isolated local verification database.");
    }
    const suffix = randomBytes(8).toString("hex");
    for (let i = 0; i < 5; i++) {
      const user = await prisma.user.create({ data: {
        anonymousId: `QA-${suffix}-${i}`, firstName: "QA", lastName: "Concurrency",
        email: `qa-${suffix}-${i}@example.test`, password: "unused-test-hash",
        role: i === 0 ? "STUDENT_TUTOR" : "STUDENT_LEARNER", gradeLevel: "GRADE_10", section: "QA",
      } });
      userIds.push(user.id);
      if (i > 0) learnerIds.push(user.id);
    }
    tutorId = userIds[0];
    const tutor = await prisma.tutorProfile.create({ data: { userId: tutorId } });
    const cls = await prisma.tutorClass.create({ data: {
      code: `QA-${suffix}`, tutorProfileId: tutor.id, subject: "MATH", gradeLevel: "GRADE_10",
      maxStudents: 1, meetingLink: "https://example.test/qa", topics: { create: { topic: "Concurrency QA" } },
      sessions: { create: { topic: "Concurrency QA", scheduledAt: new Date(Date.now() + 86400_000), duration: 60 } },
    } });
    classId = cls.id;
  });
  beforeEach(async () => {
    await prisma.classEnrollment.deleteMany({ where: { classId } });
    await prisma.notification.deleteMany({ where: { userId: tutorId } });
    await prisma.tutorClass.update({ where: { id: classId }, data: { maxStudents: 1, published: true, status: "SCHEDULED" } });
  });
  afterAll(async () => {
    if (classId) await prisma.tutorClass.delete({ where: { id: classId } });
    if (tutorId) await prisma.tutorProfile.deleteMany({ where: { userId: tutorId } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });
  it("allows exactly one of four concurrent learners to claim the last seat", async () => {
    const statuses = (await Promise.all(learnerIds.map(attempt))).map((res) => res.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409]);
    expect(await prisma.classEnrollment.count({ where: { classId } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: tutorId, type: "CLASS_ENROLLMENT_NEW" } })).toBe(1);
  });
  it("creates one enrollment for concurrent retries from the same learner", async () => {
    await prisma.tutorClass.update({ where: { id: classId }, data: { maxStudents: 2 } });
    const statuses = (await Promise.all(Array.from({ length: 4 }, () => attempt(learnerIds[0])))).map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409]);
    expect(await prisma.classEnrollment.count({ where: { classId } })).toBe(1);
  });
  it("keeps capacity valid when a tutor reduces it while another learner enrolls", async () => {
    await prisma.tutorClass.update({ where: { id: classId }, data: { maxStudents: 2 } });
    await prisma.classEnrollment.create({ data: { classId, learnerId: learnerIds[0] } });
    const [enrolled, edited] = await Promise.all([
      attempt(learnerIds[1]),
      asUser(tutorId, "STUDENT_TUTOR", () => editClass(new NextRequest(`http://localhost/api/tutor/classes/${classId}`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ maxStudents: 1 }),
      }), { params: Promise.resolve({ classId }) })),
    ]);
    expect([[201, 400], [409, 200]]).toContainEqual([enrolled.status, edited.status]);
    const cls = await prisma.tutorClass.findUniqueOrThrow({ where: { id: classId }, include: { _count: { select: { enrollments: true } } } });
    expect(cls._count.enrollments).toBeLessThanOrEqual(cls.maxStudents);
  });
});
