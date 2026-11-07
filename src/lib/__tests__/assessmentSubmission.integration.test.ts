import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as submitSession } from "@/app/api/learner/session-test-attempts/[attemptId]/submit/route";
import { POST as submitQuiz } from "@/app/api/tutor/assessments/[attemptId]/submit/route";
const hooks = vi.hoisted(() => ({ beforeTransactionalAccess: undefined as undefined | (() => Promise<void>) }));
const sessions = new AsyncLocalStorage<{ user: { id: string; role: string; gradeLevel: string } }>();
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => sessions.getStore() ?? null }));
vi.mock("@/lib/sessionTestAccess", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sessionTestAccess")>();
  return { ...actual, checkLearnerAttemptAccess: async (...args: Parameters<typeof actual.checkLearnerAttemptAccess>) => {
    if (args[2]) await hooks.beforeTransactionalAccess?.();
    return actual.checkLearnerAttemptAccess(...args);
  } };
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB assessment submission claims", () => {
  let tutorUserId: string;let learnerId: string;let tutorId: string;let classId: string;let testId: string;
  let sessionAttemptId: string;let quizAttemptId: string;
  const questionIds: string[] = [];
  const options: string[][] = [];
  let originalSetting: string | null = null;
  const settingKey = "autoCertifyOnAssessmentPass";
  const topic = "Linear Equations & Inequalities";
  const actor = <T>(id: string, role: string, fn: () => T) => sessions.run({ user: { id, role, gradeLevel: "GRADE_10" } }, fn);
  const req = (questionId: string, optionId: string) => new NextRequest("http://localhost/qa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers: [{ questionId, optionId }] }) });
  const sessionSubmit = (option: number) => actor(learnerId, "STUDENT_LEARNER", () => submitSession(req(questionIds[0], options[0][option]), { params: Promise.resolve({ attemptId: sessionAttemptId }) }));
  const quizSubmit = (option: number, id = quizAttemptId) => actor(tutorUserId, "STUDENT_TUTOR", () => submitQuiz(req(questionIds[1], options[1][option]), { params: Promise.resolve({ attemptId: id }) }));
  const createQuiz = (attemptNo: number) => prisma.assessmentAttempt.create({ data: {
    tutorProfileId: tutorId, subject: "MATH", topic, attemptNo, questionCount: 1, passPercent: 50,
    items: { create: { questionId: questionIds[1], position: 0 } },
  } });
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");
    for (const role of ["STUDENT_TUTOR", "STUDENT_LEARNER"] as const) {
      const user = await prisma.user.create({ data: { anonymousId: `QA-A-${suffix}-${role}`, email: `qa-a-${suffix}-${role}@example.test`, firstName: "QA", lastName: "Attempt", password: "unused-test-hash", role, gradeLevel: "GRADE_10", section: "QA" } });
      if (role === "STUDENT_TUTOR") tutorUserId = user.id;else learnerId = user.id;
    }
    const tutor = await prisma.tutorProfile.create({ data: { userId: tutorUserId } });tutorId = tutor.id;
    for (const origin of ["TUTOR", "BANK"] as const) {
      const question = await prisma.assessmentQuestion.create({ data: {
        subject: "MATH", topic, prompt: "QA only: choose the first option.", origin, createdById: tutorUserId,
        ...(origin === "TUTOR" ? { ownerTutorProfileId: tutorId } : {}),
        options: { create: [{ text: "First", isCorrect: true, position: 0 }, { text: "Second", isCorrect: false, position: 1 }] },
      }, include: { options: { orderBy: { position: "asc" } } } });questionIds.push(question.id);options.push(question.options.map((o) => o.id));
    }
    const cls = await prisma.tutorClass.create({ data: {
      code: `QA-A-${suffix}`, tutorProfileId: tutorId, subject: "MATH", gradeLevel: "GRADE_10", maxStudents: 2,
      topics: { create: { topic } }, meetingLink: "https://example.test/qa",
      sessions: { create: { topic, scheduledAt: new Date(Date.now() + 86400_000), duration: 60,
        test: { create: { title: "QA submission", status: "PUBLISHED", publishedAt: new Date(), questions: { create: { questionId: questionIds[0], position: 0 } } } },
      } },
    }, include: { sessions: { include: { test: true } } } });classId = cls.id;testId = cls.sessions[0].test!.id;
    originalSetting = (await prisma.platformSetting.findUnique({ where: { key: settingKey } }))?.value ?? null;
  });
  beforeEach(async () => {
    hooks.beforeTransactionalAccess = undefined;
    await prisma.platformSetting.upsert({ where: { key: settingKey }, create: { key: settingKey, value: "false" }, update: { value: "false" } });
    await prisma.sessionTestAttempt.deleteMany({ where: { sessionTestId: testId } });
    await prisma.topicCertification.deleteMany({ where: { tutorProfileId: tutorId } });
    await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: tutorId } });
    await prisma.notification.deleteMany({ where: { userId: tutorUserId } });
    await prisma.classEnrollment.upsert({ where: { classId_learnerId: { classId, learnerId } }, create: { classId, learnerId }, update: {} });
    sessionAttemptId = (await prisma.sessionTestAttempt.create({ data: { sessionTestId: testId, learnerId, kind: "PRE", totalQuestions: 1, items: { create: { questionId: questionIds[0], position: 0 } } } })).id;
    quizAttemptId = (await createQuiz(1)).id;
  });
  afterAll(async () => {
    if (tutorId) await prisma.topicCertification.deleteMany({ where: { tutorProfileId: tutorId } });
    if (tutorId) await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: tutorId } });
    if (testId) await prisma.sessionTest.deleteMany({ where: { id: testId } });
    if (classId) await prisma.tutorClass.delete({ where: { id: classId } });
    if (questionIds.length) await prisma.assessmentQuestion.deleteMany({ where: { id: { in: questionIds } } });
    if (tutorId) await prisma.tutorProfile.delete({ where: { id: tutorId } });
    const users = [tutorUserId, learnerId].filter(Boolean);
    if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });
    if (originalSetting === null) await prisma.platformSetting.deleteMany({ where: { key: settingKey } });
    else await prisma.platformSetting.update({ where: { key: settingKey }, data: { value: originalSetting } });
    await prisma.$disconnect();
  });
  it("persists one learner score and one notification under competing submissions", async () => {
    const responses = await Promise.all([sessionSubmit(0), sessionSubmit(1), sessionSubmit(0), sessionSubmit(1)]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409, 409, 409]);
    const index = responses.findIndex((r) => r.status === 200);const winner = await responses[index].json();
    const attempt = await prisma.sessionTestAttempt.findUniqueOrThrow({ where: { id: sessionAttemptId }, include: { items: true } });
    expect(attempt.scorePercent).toBe(winner.scorePercent);expect(attempt.items[0].selectedOptionId).toBe(options[0][index % 2]);
    expect(await prisma.notification.count({ where: { userId: tutorUserId, type: "SESSION_PRETEST_TAKEN" } })).toBe(1);
  });
  it("persists one qualification result and the winner's certification outcome", async () => {
    const responses = await Promise.all([quizSubmit(0), quizSubmit(1), quizSubmit(0), quizSubmit(1)]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409, 409, 409]);
    const index = responses.findIndex((r) => r.status === 200);const winner = await responses[index].json();
    const attempt = await prisma.assessmentAttempt.findUniqueOrThrow({ where: { id: quizAttemptId }, include: { items: true } });
    expect(attempt.scorePercent).toBe(winner.scorePercent);expect(attempt.items[0].selectedOptionId).toBe(options[1][index % 2]);
    const cert = await prisma.topicCertification.findUniqueOrThrow({ where: { tutorProfileId_subject_topic: { tutorProfileId: tutorId, subject: "MATH", topic } } });
    expect(cert.status).toBe(winner.scorePercent >= 50 ? "PENDING" : "REJECTED");
  });
  it("does not downgrade an already-certified topic on a failed quiz", async () => {
    await prisma.topicCertification.create({ data: { tutorProfileId: tutorId, subject: "MATH", topic, status: "CERTIFIED" } });
    expect((await quizSubmit(1)).status).toBe(200);
    expect((await prisma.topicCertification.findFirstOrThrow({ where: { tutorProfileId: tutorId } })).status).toBe("CERTIFIED");
  });
  it("preserves certification when different passing/failing attempts finish together", async () => {
    await prisma.platformSetting.update({ where: { key: settingKey }, data: { value: "true" } });
    const second = await createQuiz(2);
    expect((await Promise.all([quizSubmit(0), quizSubmit(1, second.id)])).map((r) => r.status)).toEqual([200, 200]);
    expect((await prisma.topicCertification.findFirstOrThrow({ where: { tutorProfileId: tutorId } })).status).toBe("CERTIFIED");
  });
  it("rolls back the submission claim when current enrollment was withdrawn", async () => {
    hooks.beforeTransactionalAccess = async () => { await prisma.classEnrollment.deleteMany({ where: { classId, learnerId } }); };
    expect((await sessionSubmit(0)).status).toBe(403);
    const attempt = await prisma.sessionTestAttempt.findUniqueOrThrow({ where: { id: sessionAttemptId }, include: { items: true } });
    expect(attempt.status).toBe("IN_PROGRESS");expect(attempt.submittedAt).toBeNull();expect(attempt.items[0].selectedOptionId).toBeNull();
    expect(await prisma.notification.count({ where: { userId: tutorUserId } })).toBe(0);
  });
});
