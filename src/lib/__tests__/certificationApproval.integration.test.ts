import { qualificationFixture } from "@/test/qualificationFixture";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invalidateSubjectCache } from "@/lib/subjects";
import { PATCH as review } from "@/app/api/admin/certifications/[certificationId]/route";
import { POST as submit } from "@/app/api/tutor/assessments/[attemptId]/submit/route";
import { POST as requestCertification } from "@/app/api/tutor/topic-certifications/route";
const context = new AsyncLocalStorage<{ user: { id: string; role: string; anonymousId: string }; pause?: boolean }>();
const hooks = vi.hoisted(() => ({ beforeLock: undefined as undefined | (() => Promise<void>) }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => context.getStore() ?? null }));
vi.mock("@/lib/settings", async original => ({ ...await original<typeof import("@/lib/settings")>(), getSetting: async () => true }));
vi.mock("@/lib/classLocks", async original => {
  const actual = await original<typeof import("@/lib/classLocks")>();
  return { ...actual, lockTutorProfile: async (tx: Prisma.TransactionClient, id: string) => { if (context.getStore()?.pause) await hooks.beforeLock?.();return actual.lockTutorProfile(tx, id); } };
});
describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB certification provenance and serialization", () => {
  const users: string[] = [];const profiles: string[] = [];let topic: string;let topicId: string;let certId: string;let questionId: string;let correctId: string;
  const asUser = <T>(index: number, fn: () => T, pause = false) => context.run({ user: { id: users[index], anonymousId: users[index], role: index === 0 ? "ADMIN" : "STUDENT_TUTOR" }, pause }, fn);
  const req = (body: unknown) => new NextRequest("http://localhost/qa", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const manual = { status: "CERTIFIED", method: "MANUAL", reviewNote: "Isolated QA competency review reason", evidence: "Isolated QA observed topic work sample, reference QA-ONLY" };
  const decision = (body: unknown, pause = false) => asUser(0, () => review(req(body), { params: Promise.resolve({ certificationId: certId }) }), pause);
  const attempt = (data: Partial<Prisma.AssessmentAttemptUncheckedCreateInput> = {}) => prisma.assessmentAttempt.create({ data: { tutorProfileId: profiles[0], subject: "MATH", topic, attemptNo: 1, status: "PASSED", certificationEligible: true, items: { create: { questionId, position: 0 } }, submittedAt: new Date(), questionCount: 1, correctCount: 1, scorePercent: 100, passPercent: 80, ...data } });
  const barrier = () => { let entered!: () => void;let release!: () => void;const seen = new Promise<void>(r => { entered = r; });const ready = new Promise<void>(r => { release = r; });hooks.beforeLock = async () => { entered();await ready; };return { seen, release }; };
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["127.0.0.1", "localhost"].includes(url.hostname) || !url.pathname.includes("verification")) throw Error("Use isolated local verification database only");
    const suffix = randomBytes(8).toString("hex");topic = `QA approval ${suffix}`;
    for (let i = 0; i < 3; i++) users.push((await prisma.user.create({ data: { anonymousId: `QA-CA-${suffix}-${i}`, email: `qa-ca-${suffix}-${i}@example.test`, firstName: "QA", lastName: "Approval", password: "unused", role: i === 0 ? "ADMIN" : "STUDENT_TUTOR", gradeLevel: "GRADE_10", section: "QA" } })).id);
    for (const userId of users.slice(1)) profiles.push((await prisma.tutorProfile.create({ data: { userId } })).id);
    const subject = await prisma.subject.findUniqueOrThrow({ where: { slug: "MATH" } });topicId = (await prisma.topic.create({ data: { subjectId: subject.id, name: topic, gradeLevels: ["GRADE_10"] } })).id;
    const q = await prisma.assessmentQuestion.create({ data: { ...qualificationFixture(users[0]), subject: "MATH", topic, prompt: "Isolated approval QA question", origin: "BANK", createdById: users[0], options: { create: [{ text: "QA correct", position: 0, isCorrect: true }, { text: "QA wrong", position: 1, isCorrect: false }] } }, include: { options: true } });questionId = q.id;correctId = q.options.find(o => o.isCorrect)!.id;
  });
  beforeEach(async () => {
    hooks.beforeLock = undefined;invalidateSubjectCache();
    await prisma.topicCertification.deleteMany({ where: { tutorProfileId: { in: profiles } } });await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: { in: profiles } } });await prisma.auditLog.deleteMany({ where: { adminId: users[0] } });await prisma.notification.deleteMany({ where: { userId: { in: users } } });
    certId = (await prisma.topicCertification.create({ data: { tutorProfileId: profiles[0], subject: "MATH", topic } })).id;
  });
  afterAll(async () => {
    if (profiles.length) { await prisma.topicCertification.deleteMany({ where: { tutorProfileId: { in: profiles } } });await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: { in: profiles } } }); }
    if (questionId) await prisma.assessmentQuestion.delete({ where: { id: questionId } });if (users[0]) await prisma.auditLog.deleteMany({ where: { adminId: users[0] } });
    if (profiles.length) await prisma.tutorProfile.deleteMany({ where: { id: { in: profiles } } });if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });if (topicId) await prisma.topic.delete({ where: { id: topicId } });invalidateSubjectCache();await prisma.$disconnect();
  });
  it("blocks approval without a pass and leaves no decision side effects", async () => {
    expect((await decision({ status: "CERTIFIED" })).status).toBe(409);expect(await prisma.auditLog.count({ where: { targetId: certId } })).toBe(0);expect((await prisma.topicCertification.findUniqueOrThrow({ where: { id: certId } })).status).toBe("PENDING");
  });
  it("rejects failed, unfinished, other-tutor, other-topic and below-threshold records", async () => {
    await attempt({ status: "FAILED", scorePercent: 50 });await attempt({ attemptNo: 2, status: "IN_PROGRESS", submittedAt: null });await attempt({ tutorProfileId: profiles[1] });await attempt({ topic: "Different topic" });await attempt({ attemptNo: 3, scorePercent: 70 });
    expect((await decision({ status: "CERTIFIED" })).status).toBe(409);
  });
  it("links standard approval to its real passing attempt and audits it", async () => {
    const passed = await attempt();expect((await decision({ status: "CERTIFIED" })).status).toBe(200);
    expect(await prisma.topicCertification.findUniqueOrThrow({ where: { id: certId } })).toMatchObject({ approvalMethod: "ASSESSMENT", qualifyingAttemptId: passed.id, approvalEvidence: null });
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { targetId: certId } });expect(audit.action).toBe("CERTIFICATION_APPROVED");expect(audit.reason).toContain(passed.id);
  });
  it("requires both manual fields before any decision", async () => {
    for (const body of [{ status: "CERTIFIED", method: "MANUAL" }, { ...manual, evidence: "short" }, { ...manual, reviewNote: "short" }]) expect((await decision(body)).status).toBe(400);
    expect(await prisma.auditLog.count({ where: { targetId: certId } })).toBe(0);
  });
  it("records manual evidence distinctly without inventing an assessment", async () => {
    expect((await decision(manual)).status).toBe(200);expect(await prisma.topicCertification.findUniqueOrThrow({ where: { id: certId } })).toMatchObject({ approvalMethod: "MANUAL", reviewNote: manual.reviewNote, approvalEvidence: manual.evidence, qualifyingAttemptId: null });expect(await prisma.assessmentAttempt.count({ where: { tutorProfileId: profiles[0] } })).toBe(0);expect((await prisma.auditLog.findFirstOrThrow({ where: { targetId: certId } })).action).toBe("CERTIFICATION_MANUAL_APPROVED");
  });
  it("serializes concurrent manual approvals with one audit and notification", async () => {
    expect((await Promise.all([decision(manual), decision(manual)])).map(r => r.status).sort()).toEqual([200, 409]);expect(await prisma.auditLog.count({ where: { targetId: certId } })).toBe(1);expect(await prisma.notification.count({ where: { userId: users[1], type: "CERTIFICATION_CERTIFIED" } })).toBe(1);
  });
  it("does not let a stale rejection overwrite a quiz-earned badge", async () => {
    const quiz = await attempt({ status: "IN_PROGRESS", submittedAt: null, scorePercent: 0, correctCount: 0 });
    const gate = barrier();const rejecting = decision({ status: "REJECTED", reviewNote: "Stale QA decision" }, true);await gate.seen;
    try { const response = await asUser(1, () => submit(req({ answers: [{ questionId, optionId: correctId }] }), { params: Promise.resolve({ attemptId: quiz.id }) }));expect(response.status).toBe(200); } finally { gate.release(); }
    expect((await rejecting).status).toBe(409);expect(await prisma.topicCertification.findUniqueOrThrow({ where: { id: certId } })).toMatchObject({ status: "CERTIFIED", approvalMethod: "ASSESSMENT", qualifyingAttemptId: quiz.id });
  });
  it("does not let a stale re-request overwrite a manual approval", async () => {
    const gate = barrier();const reopening = asUser(1, () => requestCertification(req({ subject: "MATH", topic })), true);await gate.seen;
    try { expect((await decision(manual)).status).toBe(200); } finally { gate.release(); }
    expect((await reopening).status).toBe(200);expect(await prisma.topicCertification.findUniqueOrThrow({ where: { id: certId } })).toMatchObject({ status: "CERTIFIED", approvalMethod: "MANUAL", approvalEvidence: manual.evidence });
  });
});
