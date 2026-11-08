import { qualificationFixture } from "@/test/qualificationFixture";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateSubjectCache } from "@/lib/subjects";
import { qualificationQuestionWhere } from "@/lib/qualificationBank";
import { POST as recordReview } from "@/app/api/admin/assessment-questions/[questionId]/review/route";
import { POST as createVersion } from "@/app/api/admin/assessment-questions/[questionId]/versions/route";
import { PATCH as editQuestion } from "@/app/api/admin/assessment-questions/[questionId]/route";
import { GET as teachingBank } from "@/app/api/tutor/question-bank/route";
import { POST as start } from "@/app/api/tutor/assessments/route";
import { POST as submit } from "@/app/api/tutor/assessments/[attemptId]/submit/route";
import { PATCH as approveCertification } from "@/app/api/admin/certifications/[certificationId]/route";
import { seedQuestionBankDatabase } from "../../../prisma/seedQuestionBank";
const context = new AsyncLocalStorage<{ user: { id: string; role: string; anonymousId: string } }>();
const hooks = vi.hoisted(() => ({ afterPick: undefined as undefined | (() => Promise<void>), autoCertify: false }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => context.getStore() ?? null }));
vi.mock("@/lib/settings", async original => ({ ...await original<typeof import("@/lib/settings")>(), getAssessmentConfig: async () => ({ questionCount: 1, minBankSize: 1, passPercent: 80 }), getSetting: async (key: string) => key === "autoCertifyOnAssessmentPass" ? hooks.autoCertify : true }));
vi.mock("@/lib/assessmentPicker", async original => {
  const actual = await original<typeof import("@/lib/assessmentPicker")>();return { ...actual, pickQuestionIds: async (...args: Parameters<typeof actual.pickQuestionIds>) => { const ids = await actual.pickQuestionIds(...args);await hooks.afterPick?.();return ids; } };
});
describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB reviewed qualification bank", () => {
  let adminId: string;let tutorUserId: string;let tutorId: string;let subjectId: string;let subject: string;let topicId: string;let topic: string;let questionId: string;let optionId: string;let classId: string;
  const asUser = <T>(admin: boolean, fn: () => T) => context.run({ user: { id: admin ? adminId : tutorUserId, role: admin ? "ADMIN" : "STUDENT_TUTOR", anonymousId: "QA-ONLY" } }, fn);
  const req = (body: unknown) => new NextRequest("http://localhost/qa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const qctx = (id = questionId) => ({ params: Promise.resolve({ questionId: id }) });
  const evidence = { decision: "APPROVE", competency: "Synthetic topic competency for isolated QA", reviewerCredentials: "Synthetic qualified reviewer fixture, isolated QA only", evidence: "Synthetic answer-key, rationale and distractor review; isolated QA only", attestation: true };
  const review = (body: unknown = evidence, id = questionId) => asUser(true, () => recordReview(req(body), qctx(id)));
  const begin = () => asUser(false, () => start(req({ subject, topic })));
  const finish = (id: string) => asUser(false, () => submit(req({ answers: [{ questionId, optionId }] }), { params: Promise.resolve({ attemptId: id }) }));
  const eligibleCount = () => prisma.assessmentQuestion.count({ where: qualificationQuestionWhere({ subject, topic }) });
  const clear = async () => {
    if (tutorId) { await prisma.topicCertification.deleteMany({ where: { tutorProfileId: tutorId } });await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: tutorId } }); }
    if (classId) { await prisma.sessionTest.deleteMany({ where: { session: { classId } } });await prisma.tutorClass.delete({ where: { id: classId } });classId = ""; }
    if (subject) { const qs = await prisma.assessmentQuestion.findMany({ where: { subject }, orderBy: { version: "desc" }, select: { id: true } });for (const q of qs) await prisma.assessmentQuestion.delete({ where: { id: q.id } }); }
    if (adminId) await prisma.auditLog.deleteMany({ where: { adminId } });
  };
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["127.0.0.1", "localhost"].includes(url.hostname) || !url.pathname.includes("verification")) throw Error("Local isolated verification database required");
    const suffix = randomBytes(6).toString("hex");subject = `QA_REVIEW_${suffix}`;topic = `QA competence ${suffix}`;
    for (const role of ["ADMIN", "STUDENT_TUTOR"] as const) { const u = await prisma.user.create({ data: { anonymousId: `QA-R-${suffix}-${role}`, email: `qa-review-${suffix}-${role}@example.test`, firstName: "QA", lastName: "Review", password: "unused", role, gradeLevel: "GRADE_10", section: "QA" } });if (role === "ADMIN") adminId = u.id;else tutorUserId = u.id; }
    tutorId = (await prisma.tutorProfile.create({ data: { userId: tutorUserId } })).id;
    const s = await prisma.subject.create({ data: { slug: subject, name: subject, gradeLevels: ["GRADE_10"], topics: { create: { name: topic, gradeLevels: ["GRADE_10"] } } }, include: { topics: true } });subjectId = s.id;topicId = s.topics[0].id;
  });
  beforeEach(async () => {
    hooks.afterPick = undefined;hooks.autoCertify = false;await clear();invalidateSubjectCache();
    const q = await prisma.assessmentQuestion.create({ data: { subject, topic, origin: "BANK", createdById: adminId, prompt: "Synthetic topic-specific question for isolated review QA", explanation: "Synthetic substantive rationale used only in isolated QA.", options: { create: [{ text: "QA correct", isCorrect: true, position: 0 }, { text: "QA distractor", isCorrect: false, position: 1 }] } }, include: { options: true } });questionId = q.id;optionId = q.options.find(o => o.isCorrect)!.id;
  });
  afterAll(async () => { await clear();if (topicId) await prisma.topic.delete({ where: { id: topicId } });if (subjectId) await prisma.subject.delete({ where: { id: subjectId } });if (tutorId) await prisma.tutorProfile.delete({ where: { id: tutorId } });if (adminId && tutorUserId) await prisma.user.deleteMany({ where: { id: { in: [adminId, tutorUserId] } } });invalidateSubjectCache();await prisma.$disconnect(); });
  it("requires admin, documented review and explicit qualified-review attestation", async () => {
    expect((await asUser(false, () => recordReview(req(evidence), qctx()))).status).toBe(401);
    for (const body of [{}, { ...evidence, attestation: false }, { ...evidence, reviewerCredentials: "short" }, { ...evidence, evidence: "short" }]) expect((await review(body)).status).toBe(400);
    expect(await eligibleCount()).toBe(0);
  });
  it("does not count or select unreviewed and demonstration content", async () => {
    expect((await begin()).status).toBe(409);await prisma.assessmentQuestion.update({ where: { id: questionId }, data: { reviewStatus: "DEMO" } });expect((await begin()).status).toBe(409);expect((await review()).status).toBe(409);expect(await prisma.assessmentAttempt.count({ where: { tutorProfileId: tutorId } })).toBe(0);
  });
  it("records review evidence and freezes approved content before first use", async () => {
    expect((await review()).status).toBe(200);expect(await eligibleCount()).toBe(1);
    expect((await asUser(true, () => editQuestion(req({ prompt: "Changed after review" }), qctx()))).status).toBe(409);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { targetId: questionId, action: "QUESTION_QUALIFICATION_APPROVED" } });expect(audit.reason).toContain(evidence.reviewerCredentials);
  });
  it("starts a reviewed attempt and links an eligible automatic certification", async () => {
    hooks.autoCertify = true;await review();
    for (const [origin, reviewStatus] of [["BANK", "DEMO"], ["BANK", "UNREVIEWED"], ["TUTOR", "APPROVED"]] as const) await prisma.assessmentQuestion.create({ data: { ...qualificationFixture(adminId), origin, reviewStatus, subject, topic, createdById: adminId, prompt: "Ineligible mixed-pool QA distractor", options: { create: [{ text: "QA mixed option", isCorrect: true, position: 0 }, { text: "QA mixed wrong", isCorrect: false, position: 1 }] } } });
    expect(await eligibleCount()).toBe(1);const response = await begin();expect(response.status).toBe(201);const attempt = await response.json();expect(attempt.certificationEligible).toBe(true);expect(attempt.items.map((item: { questionId: string }) => item.questionId)).toEqual([questionId]);expect(attempt.items[0].options[0]).not.toHaveProperty("isCorrect");
    expect((await finish(attempt.id)).status).toBe(200);expect(await prisma.topicCertification.findFirstOrThrow({ where: { tutorProfileId: tutorId } })).toMatchObject({ status: "CERTIFIED", approvalMethod: "ASSESSMENT", qualifyingAttemptId: attempt.id });
    const bank = await asUser(false, () => teachingBank(new NextRequest("http://localhost/qa?subject=" + subject)));const payload = await bank.json();expect(payload.questions).toHaveLength(3);for (const question of payload.questions) for (const field of ["qualificationEvidence", "qualificationReviewerCredentials", "qualificationReviewerId"]) expect(question).not.toHaveProperty(field);
  });
  it("revocation blocks new attempts and records an audit reason", async () => {
    await review();expect((await review({ decision: "REVOKE", reason: "Synthetic review revoked during isolated QA" })).status).toBe(200);expect(await eligibleCount()).toBe(0);expect((await begin()).status).toBe(409);expect(await prisma.auditLog.count({ where: { targetId: questionId, action: "QUESTION_QUALIFICATION_REVOKED" } })).toBe(1);
  });
  it("revocation before submission preserves the practice score without granting a badge", async () => {
    hooks.autoCertify = true;await review();const attempt = await (await begin()).json();await review({ decision: "REVOKE", reason: "Synthetic review revoked before submission" });const response = await finish(attempt.id);expect(response.status).toBe(200);expect(await response.json()).toMatchObject({ status: "PASSED", scorePercent: 100, certificationEligible: false });expect(await prisma.topicCertification.count({ where: { tutorProfileId: tutorId } })).toBe(0);
  });
  it("older practice attempts cannot certify even if their questions are reviewed later", async () => {
    hooks.autoCertify = true;const attempt = await prisma.assessmentAttempt.create({ data: { tutorProfileId: tutorId, subject, topic, attemptNo: 1, questionCount: 1, passPercent: 80, items: { create: { questionId, position: 0 } } } });await review();expect((await finish(attempt.id)).status).toBe(200);expect(await prisma.topicCertification.count({ where: { tutorProfileId: tutorId } })).toBe(0);
    const cert = await prisma.topicCertification.create({ data: { tutorProfileId: tutorId, subject, topic } });expect((await asUser(true, () => approveCertification(req({ status: "CERTIFIED" }), { params: Promise.resolve({ certificationId: cert.id }) }))).status).toBe(409);
  });
  it("correction versions require their own review", async () => {
    await review();const response = await asUser(true, () => createVersion(req({ prompt: "Synthetic corrected topic question for QA", explanation: "Synthetic corrected explanation for isolated QA.", reason: "Synthetic QA correction with independent review", options: [{ text: "New correct", isCorrect: true }, { text: "New wrong", isCorrect: false }] }), qctx()));expect(response.status).toBe(201);const version = await response.json();expect(version.reviewStatus).toBe("UNREVIEWED");expect(await eligibleCount()).toBe(0);expect((await begin()).status).toBe(409);expect((await review(evidence, version.id)).status).toBe(200);expect(await eligibleCount()).toBe(1);
  });
  it("rechecks review after selection and rejects a concurrent revocation", async () => {
    await review();let entered!: () => void;let release!: () => void;const seen = new Promise<void>(r => { entered = r; });const ready = new Promise<void>(r => { release = r; });hooks.afterPick = async () => { entered();await ready; };const starting = begin();await seen;
    try { expect((await review({ decision: "REVOKE", reason: "Synthetic revocation after picker read" })).status).toBe(200); } finally { release(); }
    expect((await starting).status).toBe(409);expect(await prisma.assessmentAttempt.count({ where: { tutorProfileId: tutorId } })).toBe(0);
  });
  it("does not approve a prior pass after its question review is revoked", async () => {
    await review();const attempt = await (await begin()).json();await finish(attempt.id);const cert = await prisma.topicCertification.findFirstOrThrow({ where: { tutorProfileId: tutorId } });await review({ decision: "REVOKE", reason: "Synthetic revocation after passing score" });expect((await asUser(true, () => approveCertification(req({ status: "CERTIFIED" }), { params: Promise.resolve({ certificationId: cert.id }) }))).status).toBe(409);
  });
  it("seeding appends demo questions, deduplicates and preserves published history/settings", async () => {
    const cls = await prisma.tutorClass.create({ data: { code: `QA-R-${randomBytes(6).toString("hex")}`, tutorProfileId: tutorId, subject, topics: { create: { topic } }, sessions: { create: { topic, scheduledAt: new Date(), duration: 30, test: { create: { title: "Retained QA published test", status: "PUBLISHED", questions: { create: { questionId, position: 0 } } } } } } }, include: { sessions: { include: { test: true } } } });classId = cls.id;const testId = cls.sessions[0].test!.id;
    const existing = await prisma.sessionTestQuestion.findMany({ where: { sessionTestId: testId } });const settings = await prisma.platformSetting.findMany({ where: { key: { in: ["assessmentQuestionCount", "assessmentPassPercent", "assessmentMinBankSize"] } } });
    const spy = vi.spyOn(prisma.subject, "findMany").mockResolvedValue([{ id: subjectId, slug: subject, name: subject, topics: [{ name: topic }] }] as never);
    try { const first = await seedQuestionBankDatabase();expect(first.totalQuestions).toBe(15);const second = await seedQuestionBankDatabase();expect(second.totalQuestions).toBe(0); } finally { spy.mockRestore(); }
    expect(await prisma.sessionTestQuestion.findMany({ where: { sessionTestId: testId } })).toEqual(existing);expect(await prisma.assessmentQuestion.count({ where: { subject, reviewStatus: "DEMO" } })).toBe(15);expect(await eligibleCount()).toBe(0);
    for (const setting of settings) expect((await prisma.platformSetting.findUniqueOrThrow({ where: { key: setting.key } })).value).toBe(setting.value);
  });
});
