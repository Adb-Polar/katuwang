import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as enroll } from "@/app/api/classes/[classId]/enroll/route";

const sessions = new AsyncLocalStorage<{ user: { id: string; role: string; anonymousId: string; gradeLevel: string } }>();
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => sessions.getStore() ?? null }));
vi.mock("@/lib/settings", () => ({ getProfilePictureRequirement: async () => "OPTIONAL" }));

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB learner enrollment schedule", () => {
  const userIds: string[] = [];
  const tutorIds: string[] = [];
  const classIds: string[] = [];
  const sessionIds: string[] = [];
  const start = new Date(Date.now() + 10 * 86400_000);
  const at = (minutes: number) => new Date(start.getTime() + minutes * 60_000);
  const attempt = (index: number) => sessions.run({ user: { id: userIds[2], role: "STUDENT_LEARNER", anonymousId: "QA", gradeLevel: "GRADE_10" } }, () => enroll(
    new NextRequest("http://localhost/api/classes/qa/enroll", { method: "POST" }),
    { params: Promise.resolve({ classId: classIds[index] }) },
  ));
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({ data: {
        anonymousId: `QA-LS-${suffix}-${i}`, email: `qa-ls-${suffix}-${i}@example.test`, firstName: "QA", lastName: "Schedule",
        password: "unused-test-hash", role: i < 2 ? "STUDENT_TUTOR" : "STUDENT_LEARNER", gradeLevel: "GRADE_10", section: "QA",
      } });
      userIds.push(user.id);
      if (i < 2) {
        const tutor = await prisma.tutorProfile.create({ data: { userId: user.id } }); tutorIds.push(tutor.id);
        const cls = await prisma.tutorClass.create({ data: {
          code: `QA-LS-${suffix}-${i}`, tutorProfileId: tutor.id, subject: "MATH", published: true, maxStudents: 5,
          sessions: { create: { topic: "Schedule QA", scheduledAt: start, duration: 60 } },
        }, include: { sessions: true } });
        classIds.push(cls.id); sessionIds.push(cls.sessions[0].id);
      }
    }
  });
  beforeEach(async () => {
    await prisma.classEnrollment.deleteMany({ where: { classId: { in: classIds } } });
    await prisma.classSession.deleteMany({ where: { classId: { in: classIds }, id: { notIn: sessionIds } } });
    await prisma.tutorClass.updateMany({ where: { id: { in: classIds } }, data: { status: "SCHEDULED" } });
    await prisma.classSession.updateMany({ where: { id: { in: sessionIds } }, data: { scheduledAt: start, duration: 60, status: "SCHEDULED" } });
    await prisma.classEnrollment.create({ data: { classId: classIds[0], learnerId: userIds[2] } });
  });
  afterAll(async () => {
    if (classIds.length) await prisma.tutorClass.deleteMany({ where: { id: { in: classIds } } });
    if (tutorIds.length) await prisma.tutorProfile.deleteMany({ where: { id: { in: tutorIds } } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it.each([[0, 60], [30, 60], [-30, 60], [-15, 120], [15, 15]])("rejects overlapping enrollment (offset %s, duration %s)", async (offset, duration) => {
    await prisma.classSession.update({ where: { id: sessionIds[1] }, data: { scheduledAt: at(offset), duration } });
    const res = await attempt(1); expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/schedule conflict/i);
    expect(await prisma.classEnrollment.count({ where: { learnerId: userIds[2] } })).toBe(1);
  });
  it.each([-60, 60, 1440])("allows non-overlapping enrollment with offset %s", async offset => {
    await prisma.classSession.update({ where: { id: sessionIds[1] }, data: { scheduledAt: at(offset) } });
    expect((await attempt(1)).status).toBe(201);
  });
  it("checks every session of the new class", async () => {
    await prisma.classSession.update({ where: { id: sessionIds[1] }, data: { scheduledAt: at(120) } });
    await prisma.classSession.create({ data: { classId: classIds[1], topic: "Later conflict", scheduledAt: start, duration: 60 } });
    expect((await attempt(1)).status).toBe(409);
  });
  it("checks later sessions in an existing class", async () => {
    await prisma.classSession.update({ where: { id: sessionIds[0] }, data: { scheduledAt: at(-120) } });
    await prisma.classSession.create({ data: { classId: classIds[0], topic: "Later conflict", scheduledAt: start, duration: 60 } });
    expect((await attempt(1)).status).toBe(409);
  });
  it.each(["CANCELLED", "COMPLETED"] as const)("ignores %s sessions in an existing class", async status => {
    await prisma.classSession.update({ where: { id: sessionIds[0] }, data: { status } });
    expect((await attempt(1)).status).toBe(201);
  });
  it.each(["CANCELLED", "COMPLETED"] as const)("ignores %s classes", async status => {
    await prisma.tutorClass.update({ where: { id: classIds[0] }, data: { status } });
    expect((await attempt(1)).status).toBe(201);
  });
  it("reserves times in a suspended class", async () => {
    await prisma.tutorClass.update({ where: { id: classIds[0] }, data: { status: "SUSPENDED" } });
    expect((await attempt(1)).status).toBe(409);
  });
  it("ignores withdrawn enrollments", async () => {
    await prisma.classEnrollment.updateMany({ where: { learnerId: userIds[2] }, data: { withdrawnAt: new Date() } });
    expect((await attempt(1)).status).toBe(201);
  });
  it("also checks conflicts before reactivating an old enrollment", async () => {
    await prisma.classEnrollment.create({ data: { classId: classIds[1], learnerId: userIds[2], withdrawnAt: new Date() } });
    expect((await attempt(1)).status).toBe(409);
    expect((await prisma.classEnrollment.findUniqueOrThrow({ where: { classId_learnerId: { classId: classIds[1], learnerId: userIds[2] } } })).withdrawnAt).not.toBeNull();
  });
  it("ignores cancelled sessions in the new class", async () => {
    await prisma.classSession.update({ where: { id: sessionIds[1] }, data: { status: "CANCELLED" } });
    await prisma.classSession.create({ data: { classId: classIds[1], topic: "Available", scheduledAt: at(120), duration: 60 } });
    expect((await attempt(1)).status).toBe(201);
  });
  it("allows only one of two simultaneous enrollments in overlapping classes", async () => {
    await prisma.classEnrollment.deleteMany({ where: { learnerId: userIds[2] } });
    const responses = await Promise.all([attempt(0), attempt(1)]);
    expect(responses.map(res => res.status).sort()).toEqual([201, 409]);
    expect(await prisma.classEnrollment.count({ where: { learnerId: userIds[2] } })).toBe(1);
  });
});
