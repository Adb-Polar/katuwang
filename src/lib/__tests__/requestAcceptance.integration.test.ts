import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { POST as accept } from "@/app/api/tutor/topic-requests/[id]/accept/route";
import { PATCH as editRequest } from "@/app/api/learner/topic-requests/[id]/route";
const mocks = vi.hoisted(() => ({ code: vi.fn(), beforeEditLock: undefined as undefined | (() => Promise<void>) }));
vi.mock("@/lib/idGenerator", () => ({ generateClassCode: mocks.code }));
const sessions = new AsyncLocalStorage<{ user: { id: string; role: string; gradeLevel: string } }>();
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => sessions.getStore() ?? null }));
// Control arrival order while retaining the real SQL lock and transaction.
vi.mock("@/lib/topicRequestHistory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/topicRequestHistory")>();
  return { ...actual, lockTopicRequestRow: async (tx: Prisma.TransactionClient, id: string) => {
    if (sessions.getStore()?.user.role === "STUDENT_LEARNER") await mocks.beforeEditLock?.();
    return actual.lockTopicRequestRow(tx, id);
  } };
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB request acceptance", () => {
  const userIds: string[] = [];
  const tutorIds: string[] = [];
  let learnerId: string;
  let requestId: string;
  const topic = "Linear Equations & Inequalities";
  const future = new Date(Date.now() + 10 * 86400_000).toISOString();
  let codePrefix: string;
  let codeSequence = 0;
  const req = (method: string, body: unknown) => new NextRequest("http://localhost/qa", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const asUser = <T>(index: number, role: string, fn: () => T) => sessions.run({ user: { id: userIds[index], role, gradeLevel: "GRADE_10" } }, fn);
  const accepting = (index: number) => asUser(index, "STUDENT_TUTOR", () => accept(req("POST", {
    subject: "MATH", gradeLevel: "GRADE_10", topics: [topic], maxStudents: 2,
    meetingLink: "https://example.test/qa", sessions: [{ topic, scheduledAt: future, duration: 60 }],
  }), { params: Promise.resolve({ id: requestId }) }));
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");codePrefix = `QA-R-${suffix}`;
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({ data: {
        anonymousId: `${codePrefix}-${i}`, email: `qa-r-${suffix}-${i}@example.test`, firstName: "QA", lastName: "Request",
        password: "unused-test-hash", role: i < 2 ? "STUDENT_TUTOR" : "STUDENT_LEARNER", gradeLevel: "GRADE_10", section: "QA",
      } });userIds.push(user.id);
      if (i < 2) {
        const tutor = await prisma.tutorProfile.create({ data: { userId: user.id } });tutorIds.push(tutor.id);
        await prisma.topicCertification.create({ data: { tutorProfileId: tutor.id, subject: "MATH", topic, status: "CERTIFIED" } });
      }
    }
    learnerId = userIds[2];
  });
  beforeEach(async () => {
    mocks.beforeEditLock = undefined;
    if (requestId) await prisma.topicRequest.delete({ where: { id: requestId } });
    await prisma.tutorClass.deleteMany({ where: { tutorProfileId: { in: tutorIds } } });
    await prisma.notification.deleteMany({ where: { userId: learnerId } });
    const now = new Date();
    const request = await prisma.topicRequest.create({ data: {
      learnerId, subject: "MATH", gradeLevel: "GRADE_10", lastSubmittedAt: now,
      expiresAt: new Date(now.getTime() + 86400_000), topics: { create: { topic } },
    } });requestId = request.id;
    mocks.code.mockImplementation(async () => `${codePrefix}-${codeSequence++}`);
  });
  afterAll(async () => {
    if (requestId) await prisma.topicRequest.delete({ where: { id: requestId } });
    if (tutorIds.length) {
      await prisma.tutorClass.deleteMany({ where: { tutorProfileId: { in: tutorIds } } });
      await prisma.tutorProfile.deleteMany({ where: { id: { in: tutorIds } } });
    }
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });
  it("creates exactly one class, history entry and notification for competing tutors", async () => {
    expect((await Promise.all([accepting(0), accepting(1)])).map((r) => r.status).sort()).toEqual([201, 409]);
    const request = await prisma.topicRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(request.status).toBe("ACCEPTED");expect(request.fulfilledClassId).not.toBeNull();
    expect(await prisma.tutorClass.count({ where: { tutorProfileId: { in: tutorIds } } })).toBe(1);
    expect(await prisma.topicRequestHistory.count({ where: { requestId } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: learnerId, type: "TOPIC_REQUEST_ACCEPTED" } })).toBe(1);
  });
  it("rejects partial coverage without side effects and accepts complete coverage", async () => {
    const second = "Quadratic Equations";
    await prisma.topicRequestTopic.create({ data: { requestId, topic: second } });
    await prisma.topicCertification.create({ data: { tutorProfileId: tutorIds[0], subject: "MATH", topic: second, status: "CERTIFIED" } });
    expect((await accepting(0)).status).toBe(400);
    expect((await prisma.topicRequest.findUniqueOrThrow({ where: { id: requestId } })).status).toBe("OPEN");
    expect(await prisma.tutorClass.count({ where: { tutorProfileId: { in: tutorIds } } })).toBe(0);
    expect(await prisma.topicRequestHistory.count({ where: { requestId } })).toBe(0);
    expect(await prisma.notification.count({ where: { userId: learnerId } })).toBe(0);
    const response = await asUser(0, "STUDENT_TUTOR", () => accept(req("POST", {
      subject: "MATH", gradeLevel: null, topics: [topic, second], maxStudents: 2,
      meetingLink: "https://example.test/qa", sessions: [{ topic, scheduledAt: future, duration: 60 }],
    }), { params: Promise.resolve({ id: requestId }) }));
    expect(response.status).toBe(201);
    const linked = await prisma.topicRequest.findUniqueOrThrow({ where: { id: requestId }, include: { fulfilledClass: { include: { topics: true } } } });
    expect(linked.fulfilledClass!.topics.map(t => t.topic).sort()).toEqual([topic, second].sort());
  });
  it("rolls back the claim when class creation fails", async () => {
    const conflict = await prisma.tutorClass.create({ data: { code: `${codePrefix}-collision`, tutorProfileId: tutorIds[0], subject: "MATH", maxStudents: 1 } });
    mocks.code.mockResolvedValue(conflict.code);
    expect((await accepting(0)).status).toBe(500);
    expect((await prisma.topicRequest.findUniqueOrThrow({ where: { id: requestId } })).status).toBe("OPEN");
    expect(await prisma.topicRequestHistory.count({ where: { requestId } })).toBe(0);
    expect(await prisma.notification.count({ where: { userId: learnerId } })).toBe(0);
  });
  it("rejects expired requests without creating a class", async () => {
    await prisma.topicRequest.update({ where: { id: requestId }, data: { expiresAt: new Date(Date.now() - 1) } });
    expect((await accepting(0)).status).toBe(409);
    expect(await prisma.tutorClass.count({ where: { tutorProfileId: { in: tutorIds } } })).toBe(0);
  });
  it("prevents a queued stale learner edit from changing an accepted request", async () => {
    let release!: () => void;let entered!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const ready = new Promise<void>((resolve) => { entered = resolve; });
    mocks.beforeEditLock = async () => { entered();await gate; };
    const edited = asUser(2, "STUDENT_LEARNER", () => editRequest(req("PATCH", {
      subject: "MATH", topics: [topic], gradeLevel: "GRADE_10", note: "Stale edit must not persist",
    }), { params: Promise.resolve({ id: requestId }) }));
    let accepted: Response;
    try { await ready;accepted = await accepting(0); }
    finally { release(); }
    const e = await edited;
    expect(accepted!.status).toBe(201);expect(e.status).toBe(409);
    const request = await prisma.topicRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(request.status).toBe("ACCEPTED");expect(request.note).toBeNull();
  });
});
