import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { seedSubjectCatalog } from "../seedSubjectCatalog";
import { seedQuestionBankDatabase } from "../seedQuestionBank";
import { loadQuestionBank } from "../questionBankData";
import { qualificationQuestionWhere } from "../../src/lib/qualificationBank";

describe.skipIf(!process.env.QUESTION_BANK_TEST_DATABASE_URL)("question seed against disposable MariaDB", () => {
  let ownsBank = false;
  const userIds: string[] = [];
  const extraQuestionIds: string[] = [];
  let tutorId: string | undefined;
  let classId: string | undefined;
  const operationId = `qa-replace-${randomUUID()}`;
  afterAll(async () => {
    if (ownsBank) {
      if (tutorId) await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: tutorId } });
      if (classId) { await prisma.sessionTest.deleteMany({ where: { session: { classId } } }); await prisma.tutorClass.delete({ where: { id: classId } }); }
      await prisma.assessmentQuestion.deleteMany({ where: { id: { in: [...loadQuestionBank().questions.map(q => q.id), ...extraQuestionIds] } } });
      await prisma.platformSetting.deleteMany({ where: { key: `questionBankReplacement:${operationId}` } });
      if (tutorId) await prisma.tutorProfile.delete({ where: { id: tutorId } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });
  it("imports the entire bank atomically, reruns without duplicates, and preserves edited/reviewed content and published history", async () => {
    const target = new URL(process.env.QUESTION_BANK_TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.QUESTION_BANK_TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(target.hostname) || target.pathname !== "/question_bank_verification") throw Error("Disposable local question_bank_verification database required");
    const prior = await prisma.assessmentQuestion.count({ where: { id: { in: loadQuestionBank().questions.map(q => q.id) } } });
    if (prior !== 0) throw Error("Use an empty disposable question verification database");
    ownsBank = true;
    const tag = randomUUID();
    const admin = await prisma.user.create({ data: { anonymousId: `QA-Q-${tag}`, email: `qa-q-${tag}@example.test`, firstName: "QA", lastName: "Question author", password: "test-only-unused", role: "ADMIN", gradeLevel: "GRADE_12", section: "QA" } });
    userIds.push(admin.id);
    await seedSubjectCatalog(prisma);
    const bank = loadQuestionBank();
    const first = bank.questions[0];
    const planned = await seedQuestionBankDatabase({ db: prisma, authorId: admin.id, dryRun: true });
    expect(planned.pendingQuestions).toBe(5840 - prior);
    expect(planned.totalQuestions).toBe(0);
    expect(await prisma.assessmentQuestion.count({ where: { id: { in: bank.questions.map(q => q.id) } } })).toBe(prior);
    // A tutor-owned copy must not replace the globally available BANK item.
    const tutorCopy = await prisma.assessmentQuestion.create({ data: { subject: first.subject, topic: first.topic, prompt: first.prompt, explanation: first.explanation, createdById: admin.id, origin: "TUTOR" } });
    extraQuestionIds.push(tutorCopy.id);
    const imported = await seedQuestionBankDatabase({ db: prisma, authorId: admin.id });
    expect(imported.totalQuestions).toBe(5840 - prior);
    expect(imported.totalTopics).toBe(292);
    expect(await prisma.assessmentOption.count({ where: { questionId: { in: bank.questions.map(q => q.id) } } })).toBe(23360);
    expect(await prisma.assessmentQuestion.count({ where: { id: { in: bank.questions.map(q => q.id) }, reviewStatus: "UNREVIEWED" } })).toBe(5840);
    expect(await prisma.assessmentQuestion.count({ where: { ...qualificationQuestionWhere({ subject: first.subject, topic: first.topic }), id: { in: bank.questions.map(q => q.id) } } })).toBe(0);
    const tutorUser = await prisma.user.create({ data: { anonymousId: `QA-T-${tag}`, email: `qa-t-${tag}@example.test`, firstName: "QA", lastName: "History", password: "unused", role: "STUDENT_TUTOR", gradeLevel: "GRADE_12", section: "QA", tutorProfile: { create: {} } }, include: { tutorProfile: true } });
    userIds.push(tutorUser.id); tutorId = tutorUser.tutorProfile!.id;
    const attempt = await prisma.assessmentAttempt.create({ data: { tutorProfileId: tutorUser.tutorProfile!.id, subject: first.subject, topic: first.topic, attemptNo: 1, questionCount: 1, passPercent: 80, items: { create: { questionId: first.id, position: 0 } } }, include: { items: true } });
    const legacy = await prisma.assessmentQuestion.create({ data: { subject: "OLD_LEGACY_SUBJECT", topic: "Legacy topic", prompt: "Synthetic old shared-bank question retained for published history", explanation: "Synthetic historical rationale", createdById: admin.id, origin: "BANK", options: { create: [{ text: "Old correct", isCorrect: true, position: 0 }, { text: "Old wrong", isCorrect: false, position: 1 }] } }, include: { options: true } });
    extraQuestionIds.push(legacy.id);
    const klass = await prisma.tutorClass.create({ data: { code: `QA-Q-${tag}`, tutorProfileId: tutorId, subject: first.subject, topics: { create: { topic: first.topic } }, sessions: { create: { topic: first.topic, scheduledAt: new Date(), duration: 30, test: { create: { title: "Synthetic retained published test", status: "PUBLISHED", questions: { create: [{ questionId: first.id, position: 0 }, { questionId: legacy.id, position: 1 }] } } } } } }, include: { sessions: { include: { test: { include: { questions: true } } } } } });
    classId = klass.id;
    const edited = await prisma.assessmentQuestion.update({ where: { id: first.id }, data: { prompt: "Synthetic independently edited QA question; preserved during reseeding", active: false, reviewStatus: "APPROVED", qualificationReviewedAt: new Date(), qualificationReviewerId: admin.id, qualificationCompetency: "Synthetic QA review", qualificationEvidence: "Synthetic QA evidence", qualificationReviewerCredentials: "Synthetic QA reviewer", lockedAt: new Date() }, include: { options: true } });
    const settings = await prisma.platformSetting.findMany();
    const second = await seedQuestionBankDatabase({ db: prisma, authorId: admin.id });
    expect(second.totalQuestions).toBe(0);expect(second.skippedQuestions).toBe(5840);
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: first.id }, include: { options: true } })).toEqual(edited);
    expect(await prisma.assessmentAttempt.findUnique({ where: { id: attempt.id }, include: { items: true } })).toEqual(attempt);
    expect(await prisma.platformSetting.findMany()).toEqual(settings);
    expect(await prisma.tutorClass.findUnique({ where: { id: classId }, include: { sessions: { include: { test: { include: { questions: true } } } } } })).toEqual(klass);
    // Force an option insert conflict to prove the question insert rolls back too.
    const sample = bank.questions[1];
    await prisma.assessmentQuestion.delete({ where: { id: sample.id } });
    const { createHash } = await import("node:crypto");
    const collision = "c" + createHash("sha256").update(`${sample.id}\0option\0${0}`).digest("hex").slice(0, 24);
    await prisma.assessmentOption.create({ data: { id: collision, questionId: first.id, position: 99, text: "Synthetic conflict option", isCorrect: false } });
    const catalogBeforeFailure = await prisma.subject.findUniqueOrThrow({ where: { slug: "MATH" } });
    await expect(seedQuestionBankDatabase({ db: prisma, authorId: admin.id, replace: true, syncCatalog: true, operationId })).rejects.toThrow();
    expect(await prisma.subject.findUniqueOrThrow({ where: { slug: "MATH" } })).toEqual(catalogBeforeFailure);
    expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: legacy.id } })).active).toBe(true);
    expect(await prisma.platformSetting.findUnique({ where: { key: `questionBankReplacement:${operationId}` } })).toBeNull();
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: sample.id } })).toBeNull();
    await prisma.assessmentOption.delete({ where: { id: collision } });
    expect((await seedQuestionBankDatabase({ db: prisma, authorId: admin.id })).totalQuestions).toBe(1);
    const replacementPlan = await seedQuestionBankDatabase({ db: prisma, authorId: admin.id, replace: true, syncCatalog: true, operationId, dryRun: true });
    expect(replacementPlan.questionsToRetire).toBe(1); expect(replacementPlan.retiredQuestions).toBe(0);
    expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: legacy.id } })).active).toBe(true);
    const replaced = await seedQuestionBankDatabase({ db: prisma, authorId: admin.id, replace: true, syncCatalog: true, operationId });
    expect(replaced.retiredQuestions).toBe(1); expect(replaced.totalQuestions).toBe(0);
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: legacy.id }, include: { options: true } })).toEqual({ ...legacy, active: false, updatedAt: expect.any(Date) });
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: first.id }, include: { options: true } })).toEqual(edited);
    expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: tutorCopy.id } })).active).toBe(true);
    expect(await prisma.tutorClass.findUnique({ where: { id: classId }, include: { sessions: { include: { test: { include: { questions: true } } } } } })).toEqual(klass);
    const later = await prisma.assessmentQuestion.create({ data: { subject: first.subject, topic: first.topic, prompt: "Synthetic shared-bank item added by an administrator after replacement", createdById: admin.id, origin: "BANK" } });
    extraQuestionIds.push(later.id);
    expect((await seedQuestionBankDatabase({ db: prisma, authorId: admin.id, replace: true, syncCatalog: true, operationId })).alreadyApplied).toBe(true);
    expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: later.id } })).active).toBe(true);
    expect((await seedQuestionBankDatabase({ db: prisma, authorId: admin.id, replace: true, subject: first.subject, topic: first.topic })).retiredQuestions).toBe(1);
    await expect(seedQuestionBankDatabase({ db: prisma, authorId: tutorUser.id })).rejects.toThrow(/ADMIN/);
    await expect(seedQuestionBankDatabase({ db: prisma, subject: "UNKNOWN" })).rejects.toThrow(/No question data/);
  }, 180000);
});
