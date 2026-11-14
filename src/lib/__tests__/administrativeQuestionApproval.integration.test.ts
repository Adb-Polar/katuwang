import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../prisma";
import { seedSubjectCatalog } from "../../../prisma/seedSubjectCatalog";
import { approveBankForAssessments } from "../administrativeQuestionApproval";
import { qualificationQuestionWhere, isQualificationAttemptEligible } from "../qualificationBank";
import { qualificationFixture } from "@/test/qualificationFixture";
import { invalidateSubjectCache } from "../subjects";
import { POST as review } from "@/app/api/admin/assessment-questions/[questionId]/review/route";
import { POST as correct } from "@/app/api/admin/assessment-questions/[questionId]/versions/route";
import { POST as start } from "@/app/api/tutor/assessments/route";
import { POST as submit } from "@/app/api/tutor/assessments/[attemptId]/submit/route";
const auth = vi.hoisted(() => ({ id: "", role: "ADMIN" }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => ({ user: { id: auth.id, role: auth.role } }) }));
vi.mock("@/lib/settings", async original => ({ ...await original<typeof import("@/lib/settings")>(), getAssessmentConfig: async () => ({ questionCount: 1, minBankSize: 1, passPercent: 80 }), getSetting: async () => false }));
describe.skipIf(!process.env.TEST_DATABASE_URL)("administrative approval against real MariaDB", () => {
  let adminId: string, tutorId: string, profileId: string;
  const reason = "Isolated QA administrator authorizes assessment use. No academic review is attested.";
  const request = (data: unknown) => new NextRequest("http://localhost/qa", { method: "POST", body: JSON.stringify(data) });
  const count = () => prisma.assessmentQuestion.count({ where: qualificationQuestionWhere({ subject: "MATH", topic: "Geometry" }) });
  const clear = async () => {
    if (profileId) { await prisma.topicCertification.deleteMany({ where: { tutorProfileId: profileId } }); await prisma.assessmentAttempt.deleteMany({ where: { tutorProfileId: profileId } }); }
    if (adminId) { await prisma.auditLog.deleteMany({ where: { adminId } }); const rows = await prisma.assessmentQuestion.findMany({ where: { createdById: adminId }, orderBy: { version: "desc" }, select: { id: true } }); for (const row of rows) await prisma.assessmentQuestion.delete({ where: { id: row.id } }); }
  };
  const question = (data: Record<string, unknown> = {}) => prisma.assessmentQuestion.create({ data: { subject: "MATH", topic: "Geometry", prompt: "A rectangle is 3 cm by 4 cm. What is its area?", explanation: "Area equals length multiplied by width, so 3 × 4 = 12 cm².", createdById: adminId, origin: "BANK", options: { create: [{ text: "12 cm²", isCorrect: true, position: 0 }, { text: "14 cm²", isCorrect: false, position: 1 }, { text: "7 cm²", isCorrect: false, position: 2 }, { text: "24 cm²", isCorrect: false, position: 3 }] }, ...data }, include: { options: true } });
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || url.hostname !== "127.0.0.1" || url.pathname !== "/administrative_approval_verification") throw Error("Dedicated disposable local approval verification database required");
    await seedSubjectCatalog(prisma); invalidateSubjectCache(); const suffix = randomUUID();
    const admin = await prisma.user.create({ data: { anonymousId: `AP-A-${suffix}`, email: `ap-admin-${suffix}@example.test`, password: "unused", firstName: "QA", lastName: "Approval", role: "ADMIN", status: "ACTIVE", gradeLevel: "GRADE_10", section: "QA" } }); adminId = admin.id;
    const tutor = await prisma.user.create({ data: { anonymousId: `AP-T-${suffix}`, email: `ap-tutor-${suffix}@example.test`, password: "unused", firstName: "QA", lastName: "Approval", role: "STUDENT_TUTOR", status: "ACTIVE", gradeLevel: "GRADE_10", section: "QA", tutorProfile: { create: {} } }, include: { tutorProfile: true } }); tutorId = tutor.id; profileId = tutor.tutorProfile!.id;
  });
  beforeEach(async () => { await clear(); auth.id = adminId; auth.role = "ADMIN"; });
  afterAll(async () => { await clear(); if (profileId) await prisma.tutorProfile.delete({ where: { id: profileId } }); if (adminId && tutorId) await prisma.user.deleteMany({ where: { id: { in: [adminId, tutorId] } } }); await prisma.$disconnect(); });
  it("previews and approves valid questions with a real administrator, an audit trail, and no invented academic credentials", async () => {
    const q = await question(); expect(await count()).toBe(0);
    expect(await approveBankForAssessments(prisma, adminId, reason, true)).toMatchObject({ questionsToApprove: 1, approvedQuestions: 0 }); expect(await count()).toBe(0);
    expect(await approveBankForAssessments(prisma, adminId, reason)).toMatchObject({ approvedQuestions: 1, academicReviewAttested: false }); expect(await count()).toBe(1);
    const approved = await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: q.id }, include: { options: true } }); expect(approved).toMatchObject({ reviewStatus: "APPROVED", qualificationApprovalMethod: "ADMIN_APPROVAL", qualificationReviewerId: adminId, qualificationReviewerCredentials: null, prompt: q.prompt, explanation: q.explanation, options: q.options });
    expect(approved.lockedAt).not.toBeNull(); expect(JSON.parse(approved.qualificationEvidence!).academicReviewAttested).toBe(false);
    expect((await prisma.auditLog.findFirstOrThrow({ where: { targetId: q.id, action: "QUESTION_ASSESSMENT_ADMIN_APPROVED" } })).reason).toContain(reason);
    expect((await approveBankForAssessments(prisma, adminId, reason)).approvedQuestions).toBe(0); expect(await prisma.assessmentQuestion.findUnique({ where: { id: q.id }, include: { options: true } })).toEqual(approved);
  });
  it("rejects an invalid question atomically and requires an active administrator", async () => {
    const valid = await question(); const invalid = await question(); await prisma.assessmentOption.update({ where: { id: invalid.options[1].id }, data: { isCorrect: true } });
    await expect(approveBankForAssessments(prisma, adminId, reason)).rejects.toThrow(/valid choices/); expect(await count()).toBe(0); expect(await prisma.auditLog.count({ where: { adminId } })).toBe(0); expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: valid.id } })).lockedAt).toBeNull();
    await expect(approveBankForAssessments(prisma, tutorId, reason)).rejects.toThrow(/administrator/);
  });
  it("preserves genuine and legacy reviews, existing locks, retired questions, demo questions and tutor-owned content", async () => {
    const reviewed = await question(qualificationFixture(adminId)); const legacy = await question({ ...qualificationFixture(adminId), qualificationApprovalMethod: null }); const date = new Date("2026-11-01T00:00:00Z"); const pending = await question({ lockedAt: date }); const retired = await question({ active: false }); const demo = await question({ reviewStatus: "DEMO" }); const own = await question({ origin: "TUTOR", ownerTutorProfileId: profileId });
    expect((await approveBankForAssessments(prisma, adminId, reason)).approvedQuestions).toBe(1); expect(await count()).toBe(3);
    for (const q of [reviewed, legacy, retired, demo, own]) expect(await prisma.assessmentQuestion.findUnique({ where: { id: q.id }, include: { options: true } })).toEqual(q);
    expect((await prisma.assessmentQuestion.findUniqueOrThrow({ where: { id: pending.id } })).lockedAt).toEqual(date);
  });
  it("allows a tutor to start and submit a real assessment using administrative approvals", async () => {
    const q = await question(); await approveBankForAssessments(prisma, adminId, reason); auth.id = tutorId; auth.role = "STUDENT_TUTOR";
    const response = await start(request({ subject: "MATH", topic: "Geometry" })); expect(response.status).toBe(201); const attempt = await response.json(); expect(attempt.questionCount).toBe(1); expect(attempt.items[0].options.every((o: object) => !("isCorrect" in o))).toBe(true);
    const graded = await submit(request({ answers: [{ questionId: q.id, optionId: q.options[0].id }] }), { params: Promise.resolve({ attemptId: attempt.id }) }); expect(graded.status).toBe(200); expect(await graded.json()).toMatchObject({ status: "PASSED", scorePercent: 100, certificationEligible: true });
  });
  it("revokes administrative approval and rejects reused approval on a corrected version", async () => {
    const q = await question(); await approveBankForAssessments(prisma, adminId, reason);
    expect((await review(request({ decision: "REVOKE", reason: "Isolated QA administrative revocation" }), { params: Promise.resolve({ questionId: q.id }) })).status).toBe(200); expect(await count()).toBe(0);
    expect((await prisma.auditLog.findFirstOrThrow({ where: { targetId: q.id, action: "QUESTION_ASSESSMENT_ADMIN_REVOKED" } })).reason).toBeTruthy();
    expect(await prisma.$transaction(tx => isQualificationAttemptEligible(tx, { certificationEligible: true, subject: "MATH", topic: "Geometry", questionCount: 1, items: [{ questionId: q.id }] }))).toBe(false);
    await approveBankForAssessments(prisma, adminId, reason);
    const updated = await correct(request({ prompt: "A rectangle is 4 cm by 5 cm. What is its area?", explanation: "Multiply the side lengths: 4 × 5 gives an area of 20 cm².", reason: "Isolated QA corrected content needs a separate approval", options: [{ text: "20 cm²", isCorrect: true }, { text: "18 cm²", isCorrect: false }] }), { params: Promise.resolve({ questionId: q.id }) }); expect(updated.status).toBe(201); const version = await updated.json(); expect(version.reviewStatus).toBe("UNREVIEWED"); expect(version.qualificationApprovalMethod).toBeNull(); expect(await count()).toBe(0);
  });
});
