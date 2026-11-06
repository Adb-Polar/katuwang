import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as addSession } from "@/app/api/tutor/classes/[classId]/sessions/route";
import { PATCH as reschedule } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/route";
import { POST as createClass } from "@/app/api/tutor/classes/route";
const sessions = new AsyncLocalStorage<{ user: { id: string; role: string; gradeLevel: string } }>();
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => sessions.getStore() ?? null }));

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB tutor schedule serialization", () => {
  let userId: string;
  let tutorId: string;
  const classIds: string[] = [];
  const sessionIds: string[] = [];
  const baseTime = Date.now() + 10 * 86400_000;
  const candidate = new Date(baseTime + 5 * 86400_000).toISOString();
  const asTutor = <T>(fn: () => T) => sessions.run({ user: { id: userId, role: "STUDENT_TUTOR", gradeLevel: "GRADE_10" } }, fn);
  const req = (method: string, body: unknown) => new NextRequest("http://localhost/qa", {
    method, headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const add = (index: number) => asTutor(() => addSession(req("POST", { topic: "Schedule QA", scheduledAt: candidate, duration: 60 }), { params: Promise.resolve({ classId: classIds[index] }) }));
  const move = (index: number) => asTutor(() => reschedule(req("PATCH", { scheduledAt: candidate }), { params: Promise.resolve({ classId: classIds[index], sessionId: sessionIds[index] }) }));
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");
    const user = await prisma.user.create({ data: {
      anonymousId: `QA-S-${suffix}`, email: `qa-s-${suffix}@example.test`, firstName: "QA", lastName: "Schedule",
      password: "unused-test-hash", role: "STUDENT_TUTOR", gradeLevel: "GRADE_10", section: "QA",
    } });
    userId = user.id;
    const tutor = await prisma.tutorProfile.create({ data: { userId } });tutorId = tutor.id;
    for (let i = 0; i < 2; i++) {
      const cls = await prisma.tutorClass.create({ data: {
        code: `QA-S-${suffix}-${i}`, tutorProfileId: tutorId, subject: "MATH", maxStudents: 1,
        meetingLink: "https://example.test/qa", topics: { create: { topic: "Schedule QA" } },
        sessions: { create: { topic: "Schedule QA", scheduledAt: new Date(baseTime + i * 86400_000), duration: 60 } },
      }, include: { sessions: true } });classIds.push(cls.id);sessionIds.push(cls.sessions[0].id);
    }
  });
  beforeEach(async () => {
    await prisma.tutorClass.deleteMany({ where: { tutorProfileId: tutorId, id: { notIn: classIds } } });
    await prisma.classSession.deleteMany({ where: { classId: { in: classIds }, id: { notIn: sessionIds } } });
    await prisma.tutorClass.updateMany({ where: { id: { in: classIds } }, data: { status: "SCHEDULED" } });
    for (let i = 0; i < 2; i++) await prisma.classSession.update({ where: { id: sessionIds[i] }, data: { scheduledAt: new Date(baseTime + i * 86400_000), status: "SCHEDULED", duration: 60 } });
  });
  afterAll(async () => {
    if (tutorId) { await prisma.tutorClass.deleteMany({ where: { tutorProfileId: tutorId } });await prisma.tutorProfile.delete({ where: { id: tutorId } }); }
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });
  it("allows one of two overlapping additions across different classes", async () => {
    expect((await Promise.all([add(0), add(1)])).map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it("allows one of two competing reschedules", async () => {
    expect((await Promise.all([move(0), move(1)])).map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it("serializes an addition against a reschedule", async () => {
    const responses = await Promise.all([add(0), move(1)]);
    expect([[201, 409], [409, 200]]).toContainEqual(responses.map((r) => r.status));
  });
  it("serializes a newly created class against session additions", async () => {
    const created = asTutor(() => createClass(req("POST", {
      subject: "MATH", topics: ["Schedule QA"], gradeLevel: "GRADE_10", maxStudents: 1,
      meetingLink: "https://example.test/qa", sessions: [{ topic: "Schedule QA", scheduledAt: candidate, duration: 60 }],
    })));
    expect((await Promise.all([created, add(0)])).map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it("reserves scheduled times in suspended classes", async () => {
    await prisma.classSession.update({ where: { id: sessionIds[0] }, data: { scheduledAt: new Date(candidate) } });
    await prisma.tutorClass.update({ where: { id: classIds[0] }, data: { status: "SUSPENDED" } });
    expect((await add(1)).status).toBe(409);
  });
});
