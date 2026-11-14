import { archivedSeedQuestions } from "../archivedSeedQuestions";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { rebuildCurriculumData } from "../rebuildCurriculumData";
import { seedSubjectCatalog } from "../seedSubjectCatalog";
import { seedQuestionBankDatabase } from "../seedQuestionBank";
import { verifySeedData } from "../verifySeedData";
import { curriculumDemoRecipe, seedId } from "../curriculumDemoData";

describe.skipIf(!process.env.CURRICULUM_REBUILD_TEST_DATABASE_URL)("transactional seeded curriculum replacement", () => {
  afterAll(() => prisma.$disconnect());
  it("archives and replaces the complete demo graph, preserves approved content and real activity, and replays safely", async () => {
    const url = process.env.CURRICULUM_REBUILD_TEST_DATABASE_URL!;
    const target = new URL(url);
    if (process.env.DATABASE_URL !== url || target.hostname !== "127.0.0.1" || target.pathname !== "/curriculum_rebuild_verification") throw Error("Use only the isolated disposable curriculum_rebuild_verification database");
    if (await prisma.user.count()) throw Error("The verification database must be empty");
    const userData = { firstName: "Synthetic", lastName: "QA", password: "synthetic-password-must-remain", gradeLevel: "GRADE_10" as const, section: "QA" };
    const admin = await prisma.user.create({ data: { ...userData, anonymousId: "QA-ADMIN", email: "qa-admin@example.test", role: "SUPER_ADMIN" } });
    const realTutor = await prisma.user.create({ data: { ...userData, anonymousId: "QA-REAL-T", email: "real-tutor@example.test", role: "STUDENT_TUTOR", tutorProfile: { create: {} } }, include: { tutorProfile: true } });
    const realLearner = await prisma.user.create({ data: { ...userData, anonymousId: "QA-REAL-L", email: "real-learner@example.test", role: "STUDENT_LEARNER" } });
    const seedTutor = await prisma.user.create({ data: { ...userData, anonymousId: "TUT-0030", email: "maria.santos@katuwang.test", role: "STUDENT_TUTOR", tutorProfile: { create: {} } }, include: { tutorProfile: true } });
    const seedLearner = await prisma.user.create({ data: { ...userData, anonymousId: "STU-0030", email: "juan.delacruz@katuwang.test", role: "STUDENT_LEARNER" } });
    await seedSubjectCatalog(prisma);
    await seedQuestionBankDatabase({ db: prisma, authorId: admin.id });
    await prisma.assessmentQuestion.updateMany({ data: { reviewStatus: "APPROVED", qualificationApprovalMethod: "ADMIN_APPROVAL", qualificationReviewedAt: new Date(), qualificationReviewerId: admin.id, qualificationCompetency: "Synthetic integration fixture", qualificationEvidence: "Synthetic integration fixture", lockedAt: new Date() } });
    const bankBefore = await prisma.assessmentQuestion.findMany({ where: { origin: "BANK" }, include: { options: { orderBy: { id: "asc" } } }, orderBy: { id: "asc" } });
    const [legacySource, legacyEditedSource] = [...archivedSeedQuestions().values()];
    async function legacyFixture(source: typeof legacySource, edited = false) {
      return prisma.assessmentQuestion.create({ data: { id: source.id, subject: source.subject, topic: source.topic,
        prompt: edited ? "Independently changed historical item" : source.prompt, explanation: source.explanation,
        createdById: admin.id, reviewStatus: "UNREVIEWED", active: false,
        options: { create: source.options.map((o, position) => ({ ...o, position })) } }, include: { options: { orderBy: { position: "asc" } } } });
    }
    const oldAuthored = await legacyFixture(legacySource), editedAuthored = await legacyFixture(legacyEditedSource, true);
    const oldCatalog = await prisma.subject.create({ data: { slug: "LEGACY_SEED", name: "Synthetic old seed subject", topics: { create: [{ name: "Old seed topic" }] } } });
    const oldQ = await prisma.assessmentQuestion.create({ data: { subject: "LEGACY_SEED", topic: "Old seed topic", prompt: "[DEMO] Synthetic old question", createdById: admin.id, reviewStatus: "DEMO", active: false,
      options: { create: [{ position: 0, text: "Correct", isCorrect: true }, { position: 1, text: "Wrong", isCorrect: false }] } } });
    const oldClass = await prisma.tutorClass.create({ data: { code: "OLD-SEED", tutorProfileId: seedTutor.tutorProfile!.id, subject: "LEGACY_SEED", gradeLevel: "GRADE_10", topics: { create: { topic: "Old seed topic" } },
      enrollments: { create: { learnerId: seedLearner.id } }, sessions: { create: { topic: "Old seed topic", scheduledAt: new Date(), duration: 60,
        test: { create: { title: "[DEMO] old test", status: "PUBLISHED", questions: { create: { questionId: oldQ.id, position: 0 } } } } } } } });
    // A different seeded tutor has real participants: preserve that entire graph.
    const mixedTutor = await prisma.user.create({ data: { ...userData, anonymousId: "TUT-0031", email: "demo@tutor.test", role: "STUDENT_TUTOR", tutorProfile: { create: {} } }, include: { tutorProfile: true } });
    const protectedClass = await prisma.tutorClass.create({ data: { code: "MIXED-PRESERVED", tutorProfileId: mixedTutor.tutorProfile!.id, subject: "MATH", gradeLevel: "GRADE_10", topics: { create: { topic: "Geometry" } }, enrollments: { create: { learnerId: realLearner.id } } }, include: { topics: true, enrollments: true } });
    const realClass = await prisma.tutorClass.create({ data: { code: "REAL-PRESERVED", tutorProfileId: realTutor.tutorProfile!.id, subject: "MATH", gradeLevel: "GRADE_10" } });
    const args = { adminId: admin.id, operationId: "qa-rebuild-v1", reason: "Synthetic integration fixture: rebuild seeded curriculum data." };
    const plan = await rebuildCurriculumData(prisma, args);
    expect(plan).toMatchObject({ dryRun: true, expected: { subjects: 47, topics: 292, gradeAssociations: 408, bankQuestions: 5840, approvedQuestions: 5840, classes: 414 } });
    expect(await prisma.seedDataRebuild.count()).toBe(0);
    expect(await prisma.tutorClass.findUnique({ where: { id: oldClass.id } })).not.toBeNull();
    await expect(rebuildCurriculumData(prisma, { ...args, adminId: realTutor.id, apply: true })).rejects.toThrow("super administrator");
    await expect(rebuildCurriculumData(prisma, { ...args, apply: true, expectedFingerprint: "stale" })).rejects.toThrow("changed since the preview");
    // A late insert must invalidate the plan before any removal.
    const collision = await prisma.tutorClass.create({ data: { code: "CUR-0001", tutorProfileId: realTutor.tutorProfile!.id, subject: "MATH" } });
    await expect(rebuildCurriculumData(prisma, { ...args, apply: true, expectedFingerprint: "fingerprint" in plan ? plan.fingerprint : "" })).rejects.toThrow();
    // The collision is outside seed inventory. A fresh preview reaches the write
    // failure and proves deleted rows AND the archive roll back atomically.
    const fresh = await rebuildCurriculumData(prisma, args);
    await expect(rebuildCurriculumData(prisma, { ...args, apply: true, expectedFingerprint: "fingerprint" in fresh ? fresh.fingerprint : "" })).rejects.toThrow();
    expect(await prisma.tutorClass.findUnique({ where: { id: oldClass.id } })).not.toBeNull();
    expect(await prisma.seedDataRebuild.count()).toBe(0);
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: oldQ.id } })).not.toBeNull();
    await prisma.tutorClass.delete({ where: { id: collision.id } });
    const finalPlan = await rebuildCurriculumData(prisma, args);
    const result = await rebuildCurriculumData(prisma, { ...args, apply: true, expectedFingerprint: "fingerprint" in finalPlan ? finalPlan.fingerprint : "" });
    expect(result).toMatchObject({ dryRun: false, syntheticTutorCertificationsGranted: 0, emailsSent: 0, preserved: { mixedActivityClasses: 1 }, created: { classes: 414, requests: 408, tests: 414, ownedQuestions: 6 } });
    expect(await verifySeedData(prisma)).toMatchObject({ subjects: 47, topics: 292, gradeAssociations: 408, classes: 414, requests: 408, approvedQuestions: 5840, invalidRecords: 0 });
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: oldQ.id } })).toBeNull();
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: oldAuthored.id } })).toBeNull();
    expect(await prisma.assessmentQuestion.findUnique({ where: { id: editedAuthored.id }, include: { options: { orderBy: { position: "asc" } } } })).toEqual(editedAuthored);
    expect(await prisma.tutorClass.findUnique({ where: { id: oldClass.id } })).toBeNull();
    expect(await prisma.subject.findUnique({ where: { id: oldCatalog.id } })).toBeNull();
    expect(await prisma.tutorClass.findUnique({ where: { id: protectedClass.id }, include: { topics: true, enrollments: true } })).toEqual(protectedClass);
    expect(await prisma.tutorClass.findUnique({ where: { id: realClass.id } })).toEqual(realClass);
    expect(await prisma.user.findUnique({ where: { id: realLearner.id } })).toEqual(realLearner);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: seedTutor.id } })).password).toBe(seedTutor.password);
    expect(await prisma.assessmentQuestion.findMany({ where: { id: { in: bankBefore.map(q => q.id) } }, include: { options: { orderBy: { id: "asc" } } }, orderBy: { id: "asc" } })).toEqual(bankBefore);
    const archive = await prisma.seedDataRebuild.findUniqueOrThrow({ where: { id: args.operationId } });
    const restored = gunzipSync(archive.backup);
    expect(createHash("sha256").update(restored).digest("hex")).toBe(archive.backupSha256);
    const snapshot = JSON.parse(restored.toString());
    expect(snapshot.tables.tutorClasses.some((c: { id: string }) => c.id === oldClass.id)).toBe(true);
    expect(snapshot.tables.assessmentQuestions.some((q: { id: string }) => q.id === oldQ.id)).toBe(true);
    expect(snapshot.tables.users).toBeUndefined();
    expect(snapshot.tables.tutorClasses.some((c: { id: string }) => c.id === protectedClass.id)).toBe(false);
    const beforeReplay = await prisma.tutorClass.count();
    expect(await rebuildCurriculumData(prisma, { ...args, apply: true })).toMatchObject({ alreadyApplied: true });
    expect(await prisma.tutorClass.count()).toBe(beforeReplay);
    expect(await prisma.topicCertification.count({ where: { reviewNote: { contains: "CURRICULUM DEMO" }, status: "CERTIFIED" } })).toBe(0);
    // A deliberately new operation refreshes dates without duplicating IDs.
    const refreshArgs = { ...args, operationId: "qa-rebuild-refresh" };
    const refresh = await rebuildCurriculumData(prisma, refreshArgs);
    await rebuildCurriculumData(prisma, { ...refreshArgs, apply: true, expectedFingerprint: "fingerprint" in refresh ? refresh.fingerprint : "" });
    expect(await prisma.tutorClass.count()).toBe(beforeReplay);
    expect(await verifySeedData(prisma)).toMatchObject({ classes: 414, approvedQuestions: 5840 });
    // Mutating bank content is rejected rather than reusing old approval evidence.
    const canonical = curriculumDemoRecipe()[0].questions[0];
    await prisma.assessmentQuestion.update({ where: { id: canonical.id }, data: { explanation: "Synthetic changed explanation" } });
    await expect(rebuildCurriculumData(prisma, { ...args, operationId: "qa-edited-bank" })).rejects.toThrow("edited or disabled");
    await prisma.assessmentQuestion.update({ where: { id: canonical.id }, data: { explanation: canonical.explanation } });
    expect(await prisma.tutorClass.findUnique({ where: { id: seedId("class", curriculumDemoRecipe()[0].key) } })).not.toBeNull();
  }, 180000);
});
