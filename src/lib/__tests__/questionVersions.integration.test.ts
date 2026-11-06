import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateSubjectCache } from "@/lib/subjects";
import { PATCH as editBank, DELETE as deleteBank } from "@/app/api/admin/assessment-questions/[questionId]/route";
import { POST as createVersion } from "@/app/api/admin/assessment-questions/[questionId]/versions/route";
import { PATCH as publish } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route";
import { PUT as replaceQuestions } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route";
import { DELETE as deleteTest } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route";
import { PATCH as editTutor } from "@/app/api/tutor/questions/[questionId]/route";
import { POST as startQualification } from "@/app/api/tutor/assessments/route";
import { POST as startPre } from "@/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route";
import { POST as submitPre } from "@/app/api/learner/session-test-attempts/[attemptId]/submit/route";
const context = new AsyncLocalStorage<{ user: { id: string; role: string; anonymousId: string }; operation?: string }>();
const hooks = vi.hoisted(() => ({ beforeQuestionLock: undefined as undefined | (() => Promise<void>), beforeTestLock: undefined as undefined | (() => Promise<void>), afterPick: undefined as undefined | (() => Promise<void>) }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => context.getStore() ?? null }));
vi.mock("@/lib/settings", async original => ({ ...await original<typeof import("@/lib/settings")>(), getAssessmentConfig: async () => ({ questionCount: 1, minBankSize: 1, passPercent: 80 }) }));
vi.mock("@/lib/questionLocks", async original => {
  const actual = await original<typeof import("@/lib/questionLocks")>();
  return { ...actual, lockQuestionRows: async (tx: Prisma.TransactionClient, ids: string[]) => {
    if (context.getStore()?.operation === "edit") await hooks.beforeQuestionLock?.();
    return actual.lockQuestionRows(tx, ids);
  }, lockSessionTestRow: async (tx: Prisma.TransactionClient, id: string) => {
    if (context.getStore()?.operation === "stale-test-write") await hooks.beforeTestLock?.();
    return actual.lockSessionTestRow(tx, id);
  } };
});
vi.mock("@/lib/assessmentPicker", async original => {
  const actual = await original<typeof import("@/lib/assessmentPicker")>();
  return { ...actual, pickQuestionIds: async (...args: Parameters<typeof actual.pickQuestionIds>) => { const ids = await actual.pickQuestionIds(...args);await hooks.afterPick?.();return ids; } };
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB immutable question versions", () => {
  const users: string[] = [];const profiles: string[] = [];
  let classId: string;let sessionId: string;let testId: string;let questionId: string;let topicId: string;let topic: string;
  const req = (method: string, body?: unknown) => new NextRequest("http://localhost/qa", { method, ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) });
  const asUser = <T>(index: number, fn: () => T, operation?: string) => context.run({ user: { id: users[index], role: index === 0 ? "ADMIN" : index === 3 ? "STUDENT_LEARNER" : "STUDENT_TUTOR", anonymousId: users[index] }, operation }, fn);
  const qctx = () => ({ params: Promise.resolve({ questionId }) });
  const tctx = () => ({ params: Promise.resolve({ classId, sessionId }) });
  const publishTest = () => asUser(1, () => publish(req("PATCH", { status: "PUBLISHED" }), tctx()));
  const versionBody = { prompt: "Corrected QA wording, separate immutable version.", reason: "Correct the wording and answer without changing the original version.", options: [{ text: "New first choice", isCorrect: false }, { text: "New second choice", isCorrect: true }] };
  const version = () => asUser(0, () => createVersion(req("POST", versionBody), qctx()));
  const clear = async () => {
    if (users.length) await prisma.auditLog.deleteMany({ where: { adminId: { in: users } } });
    if (sessionId) await prisma.sessionTest.deleteMany({ where: { sessionId } });
    if (profiles.length) await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: { in: profiles } } });
    const questions = await prisma.assessmentQuestion.findMany({ where: { createdById: { in: users } }, orderBy: { version: "desc" }, select: { id: true } });
    for (const question of questions) await prisma.assessmentQuestion.delete({ where: { id: question.id } });
    if (classId) await prisma.classEnrollment.deleteMany({ where: { classId } });
  };
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");topic = `QA versions ${suffix}`;
    for (let i = 0; i < 4; i++) users.push((await prisma.user.create({ data: { anonymousId: `QA-QV-${suffix}-${i}`, email: `qa-qv-${suffix}-${i}@example.test`, firstName: "QA", lastName: "Versions", password: "unused-test-hash", role: i === 0 ? "ADMIN" : i === 3 ? "STUDENT_LEARNER" : "STUDENT_TUTOR", gradeLevel: "GRADE_10", section: "QA" } })).id);
    for (const userId of users.slice(1, 3)) profiles.push((await prisma.tutorProfile.create({ data: { userId } })).id);
    const subject = await prisma.subject.findUniqueOrThrow({ where: { slug: "MATH" } });
    topicId = (await prisma.topic.create({ data: { subjectId: subject.id, name: topic, gradeLevels: ["GRADE_10"] } })).id;
    await prisma.topicCertification.create({ data: { tutorProfileId: profiles[0], subject: "MATH", topic, status: "CERTIFIED" } });
    const cls = await prisma.tutorClass.create({ data: { code: `QA-QV-${suffix}`, tutorProfileId: profiles[0], subject: "MATH", maxStudents: 2, topics: { create: { topic } }, sessions: { create: { topic, scheduledAt: new Date(Date.now() + 86400000), duration: 60 } } }, include: { sessions: true } });classId = cls.id;sessionId = cls.sessions[0].id;
  });
  beforeEach(async () => {
    hooks.beforeQuestionLock = undefined;hooks.beforeTestLock = undefined;hooks.afterPick = undefined;
    await clear();invalidateSubjectCache();
    questionId = (await prisma.assessmentQuestion.create({ data: { subject: "MATH", topic, prompt: "Original QA wording, preserved for history.", origin: "BANK", createdById: users[0], options: { create: [{ text: "Original correct", isCorrect: true, position: 0 }, { text: "Original wrong", isCorrect: false, position: 1 }] } } })).id;
    testId = (await prisma.sessionTest.create({ data: { sessionId, title: "QA immutable version test", questions: { create: { questionId, position: 0 } } } })).id;
  });
  afterAll(async () => {
    await clear();if (classId) await prisma.tutorClass.delete({ where: { id: classId } });
    if (profiles.length) await prisma.tutorProfile.deleteMany({ where: { id: { in: profiles } } });
    if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });
    if (topicId) await prisma.topic.delete({ where: { id: topicId } });invalidateSubjectCache();await prisma.$disconnect();
  });
  it("requires an administrator and a meaningful correction reason", async () => {
    expect((await asUser(2, () => createVersion(req("POST", versionBody), qctx()))).status).toBe(401);
    expect((await asUser(0, () => createVersion(req("POST", { ...versionBody, reason: "short" }), qctx()))).status).toBe(400);
    expect((await asUser(0, () => createVersion(req("POST", null), qctx()))).status).toBe(400);
    expect(await prisma.assessmentQuestion.count({ where: { previousVersionId: questionId } })).toBe(0);
  });
  it("locks publication before the first attempt and blocks edits/deletion", async () => {
    expect((await publishTest()).status).toBe(200);
    expect((await asUser(0, () => editBank(req("PATCH", { prompt: "A changed published prompt" }), qctx()))).status).toBe(409);
    expect((await asUser(0, () => deleteBank(req("DELETE"), qctx()))).status).toBe(409);
    expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: questionId } })).lockedAt).not.toBeNull();
  });
  it("creates a corrected version while the original published attempt still grades correctly", async () => {
    await publishTest();await prisma.classEnrollment.create({ data: { classId, learnerId: users[3] } });
    const attemptResponse = await asUser(3, () => startPre(req("POST"), { params: Promise.resolve({ classId, sessionId, kind: "PRE" }) }));expect(attemptResponse.status).toBe(201);const attempt = await attemptResponse.json();
    const original = await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: questionId }, include: { options: { orderBy: { position: "asc" } } } });
    const response = await version();expect(response.status).toBe(201);const corrected = await response.json();
    expect(corrected).toMatchObject({ version: 2, previousVersionId: questionId, active: true });
    expect((await asUser(0, () => editBank(req("PATCH", { active: true }), qctx()))).status).toBe(409);
    const deletingVersion = await asUser(0, () => deleteBank(req("DELETE"), { params: Promise.resolve({ questionId: corrected.id }) }));
    expect(deletingVersion.status).toBe(409);
    const saved = await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: questionId }, include: { options: { orderBy: { position: "asc" } } } });
    expect(saved.prompt).toBe(original.prompt);expect(saved.options).toEqual(original.options);expect(saved.active).toBe(false);
    const submitted = await asUser(3, () => submitPre(req("POST", { answers: [{ questionId, optionId: original.options[0].id }] }), { params: Promise.resolve({ attemptId: attempt.id }) }));
    expect(submitted.status).toBe(200);expect((await submitted.json()).scorePercent).toBe(100);
    expect((await prisma.sessionTestQuestion.findFirstOrThrow({ where: { sessionTestId: testId } })).questionId).toBe(questionId);
  });
  it("creates one successor and audit event for concurrent corrections", async () => {
    const responses = await Promise.all([version(), version()]);expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
    const created = await responses.find(r => r.status === 201)!.json();
    expect(await prisma.assessmentQuestion.count({ where: { previousVersionId: questionId } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { targetId: created.id, action: "QUESTION_VERSION_CREATED" } })).toBe(1);
  });
  it("retirement blocks future publication and question selection", async () => {
    expect((await asUser(0, () => editBank(req("PATCH", { active: false }), qctx()))).status).toBe(200);
    expect((await publishTest()).status).toBe(409);
    expect((await asUser(1, () => replaceQuestions(req("PUT", { questionIds: [questionId] }), tctx()))).status).toBe(400);
    expect((await asUser(2, () => startQualification(req("POST", { subject: "MATH", topic })))).status).toBe(409);
  });
  it("rechecks retirement after a qualification selection waits", async () => {
    let release!: () => void;let entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });const ready = new Promise<void>(resolve => { entered = resolve; });
    hooks.afterPick = async () => { entered();await gate; };
    const starting = asUser(2, () => startQualification(req("POST", { subject: "MATH", topic })));
    try { await ready;expect((await asUser(0, () => editBank(req("PATCH", { active: false }), qctx()))).status).toBe(200); }
    finally { release(); }
    expect((await starting).status).toBe(409);expect(await prisma.assessmentAttempt.count({ where: { tutorProfileId: profiles[1] } })).toBe(0);
  });
  it.each(["replace", "delete"])("rejects a queued draft %s after publication wins", async action => {
    let release!: () => void;let entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });const ready = new Promise<void>(resolve => { entered = resolve; });hooks.beforeTestLock = async () => { entered();await gate; };
    const writing = asUser(1, () => action === "replace" ? replaceQuestions(req("PUT", { questionIds: [questionId] }), tctx()) : deleteTest(req("DELETE"), tctx()), "stale-test-write");
    try { await ready;expect((await publishTest()).status).toBe(200); } finally { release(); }
    expect((await writing).status).toBe(409);expect((await prisma.sessionTest.findUniqueOrThrow({ where: { id: testId } })).status).toBe("PUBLISHED");
  });
  it.each(["BANK", "TUTOR"])("rejects a queued %s content edit after publication wins", async origin => {
    if (origin === "TUTOR") await prisma.assessmentQuestion.update({ where: { id: questionId }, data: { origin: "TUTOR", ownerTutorProfileId: profiles[0], createdById: users[1] } });
    let release!: () => void;let entered!: () => void;const gate = new Promise<void>(resolve => { release = resolve; });const ready = new Promise<void>(resolve => { entered = resolve; });hooks.beforeQuestionLock = async () => { entered();await gate; };
    const editing = asUser(origin === "BANK" ? 0 : 1, () => origin === "BANK" ? editBank(req("PATCH", { prompt: "Stale content edit must not commit" }), qctx()) : editTutor(req("PATCH", { prompt: "Stale content edit must not commit" }), qctx()), "edit");
    try { await ready;expect((await publishTest()).status).toBe(200); } finally { release(); }
    expect((await editing).status).toBe(409);expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: questionId } })).prompt).toBe("Original QA wording, preserved for history.");
  });
});
