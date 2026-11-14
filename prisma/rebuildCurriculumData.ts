import { createHash, randomBytes } from "node:crypto";
import { gzipSync } from "node:zlib";
import bcrypt from "bcryptjs";
import { Prisma, type GradeLevel, type PrismaClient } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";
import { qualificationQuestionWhere } from "../src/lib/qualificationBank";
import { applySubjectCatalog } from "./seedSubjectCatalog";
import { loadQuestionBank } from "./questionBankData";
import { curriculumDemoRecipe, DEMO_TAG, isSeedEmail, REBUILD_REVISION, seedId } from "./curriculumDemoData";
import { archivedSeedQuestions, matchesArchivedSeedQuestion } from "./archivedSeedQuestions";

type Tx = Prisma.TransactionClient;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
const pair = (subject: string, topic: string) => JSON.stringify([subject, topic]);
const day = 86400000;

export class SeedRebuildError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}

async function inventory(tx: Tx) {
  const allUsers = await tx.user.findMany({ select: { id: true, email: true, anonymousId: true, role: true, gradeLevel: true, status: true }, orderBy: { id: "asc" } });
  const users = allUsers.filter(u => ["STUDENT_TUTOR", "STUDENT_LEARNER"].includes(u.role) && isSeedEmail(u.email));
  const userIds = users.map(u => u.id);
  const profiles = await tx.tutorProfile.findMany({ where: { userId: { in: userIds } }, orderBy: { id: "asc" } });
  const profileIds = profiles.map(p => p.id);
  const userSet = new Set(userIds);
  const profileSet = new Set(profileIds);
  // A seed-owned class can have real participants. Preserve that complete history.
  const candidates = await tx.tutorClass.findMany({ where: { tutorProfileId: { in: profileIds } }, include: {
    enrollments: true, recommendations: true, reports: true, fulfilledRequests: true, completionCertificates: { select: { learnerId: true, tutorId: true } },
    sessions: { include: { test: { include: { attempts: { select: { learnerId: true } } } } } },
  }, orderBy: { id: "asc" } });
  const classes = candidates.filter(c => c.enrollments.every(e => userSet.has(e.learnerId))
    && c.recommendations.every(r => userSet.has(r.learnerId)) && c.reports.every(r => userSet.has(r.reporterId))
    && c.fulfilledRequests.every(r => userSet.has(r.learnerId) && (!r.directedTutorProfileId || profileSet.has(r.directedTutorProfileId))) && c.completionCertificates.every(r => userSet.has(r.learnerId) && userSet.has(r.tutorId))
    && c.sessions.every(s => !s.test || s.test.attempts.every(a => userSet.has(a.learnerId))));
  const classIds = classes.map(c => c.id);
  const classSet = new Set(classIds);
  const sessionIds = classes.flatMap(c => c.sessions.map(s => s.id));
  const testIds = classes.flatMap(c => c.sessions.flatMap(s => s.test ? [s.test.id] : []));
  const requests = await tx.topicRequest.findMany({ where: { learnerId: { in: userIds } }, orderBy: { id: "asc" } });
  const requestIds = requests.filter(r => (!r.fulfilledClassId || classSet.has(r.fulfilledClassId))
    && (!r.directedTutorProfileId || profileSet.has(r.directedTutorProfileId))).map(r => r.id);
  // Do not clear certifications for a demo tutor who still hosts a protected class.
  const protectedProfileIds = new Set(candidates.filter(c => !classSet.has(c.id)).map(c => c.tutorProfileId));
  const replaceProfileIds = profileIds.filter(id => !protectedProfileIds.has(id));
  const attempts = await tx.assessmentAttempt.findMany({ where: { tutorProfileId: { in: replaceProfileIds } }, orderBy: { id: "asc" } });
  const attemptIds = attempts.map(a => a.id);
  const attemptSet = new Set(attemptIds);
  const testSet = new Set(testIds);
  const oldQuestions = await tx.assessmentQuestion.findMany({ where: { OR: [
    { origin: "BANK", reviewStatus: "DEMO" },
    { origin: "BANK", reviewStatus: { not: "APPROVED" }, id: { in: [...archivedSeedQuestions().keys()] } },
    { origin: "TUTOR", OR: [{ createdById: { in: userIds } }, { ownerTutorProfileId: { in: replaceProfileIds } }] },
  ] }, include: { options: { orderBy: { position: "asc" } }, attemptItems: { select: { attemptId: true } }, sessionTestLinks: { select: { sessionTestId: true } },
    sessionTestItems: { select: { attempt: { select: { sessionTestId: true } } } }, nextVersions: { select: { id: true } } }, orderBy: { id: "asc" } });
  const questionIds = oldQuestions.filter(q => (q.origin === "TUTOR" || q.reviewStatus === "DEMO" || matchesArchivedSeedQuestion(q)) && !q.previousVersionId && !q.nextVersions.length
    && q.attemptItems.every(i => attemptSet.has(i.attemptId)) && q.sessionTestLinks.every(i => testSet.has(i.sessionTestId))
    && q.sessionTestItems.every(i => testSet.has(i.attempt.sessionTestId))).map(q => q.id);
  const reportIds = (await tx.report.findMany({ where: { OR: [{ classId: { in: classIds } }, { reportedTutorProfileId: { in: replaceProfileIds }, reporterId: { in: userIds } }] }, select: { id: true } })).map(r => r.id);
  const snapshot = {
    subjects: await tx.subject.findMany({ orderBy: { id: "asc" } }), topics: await tx.topic.findMany({ orderBy: { id: "asc" } }),
    tutorClasses: await tx.tutorClass.findMany({ where: { id: { in: classIds } }, orderBy: { id: "asc" } }),
    classTopics: await tx.classTopic.findMany({ where: { classId: { in: classIds } }, orderBy: { id: "asc" } }),
    classSessions: await tx.classSession.findMany({ where: { id: { in: sessionIds } }, orderBy: { id: "asc" } }),
    classEnrollments: await tx.classEnrollment.findMany({ where: { classId: { in: classIds } }, orderBy: { id: "asc" } }),
    classRecommendations: await tx.classRecommendation.findMany({ where: { classId: { in: classIds } }, orderBy: { id: "asc" } }),
    classAppeals: await tx.classAppeal.findMany({ where: { classId: { in: classIds } }, orderBy: { id: "asc" } }),
    // PDFs are binary and must be archived as base64, not JSON integer objects.
    completionCertificates: (await tx.completionCertificate.findMany({ where: { classId: { in: classIds } }, orderBy: { id: "asc" } })).map(c => ({ ...c, pdf: c.pdf ? Buffer.from(c.pdf).toString("base64") : null })),
    reports: await tx.report.findMany({ where: { id: { in: reportIds } }, orderBy: { id: "asc" } }),
    reportViolations: await tx.reportViolation.findMany({ where: { reportId: { in: reportIds } }, orderBy: { id: "asc" } }),
    topicRequests: requests.filter(r => requestIds.includes(r.id)),
    topicRequestTopics: await tx.topicRequestTopic.findMany({ where: { requestId: { in: requestIds } }, orderBy: { id: "asc" } }),
    topicRequestSlots: await tx.topicRequestSlot.findMany({ where: { requestId: { in: requestIds } }, orderBy: { id: "asc" } }),
    topicRequestHistory: await tx.topicRequestHistory.findMany({ where: { requestId: { in: requestIds } }, orderBy: { id: "asc" } }),
    topicCertifications: await tx.topicCertification.findMany({ where: { tutorProfileId: { in: replaceProfileIds } }, orderBy: { id: "asc" } }),
    assessmentAttempts: attempts,
    assessmentAttemptItems: await tx.assessmentAttemptItem.findMany({ where: { attemptId: { in: attemptIds } }, orderBy: { id: "asc" } }),
    questionRequests: await tx.questionRequest.findMany({ where: { tutorProfileId: { in: replaceProfileIds } }, orderBy: { id: "asc" } }),
    sessionTests: await tx.sessionTest.findMany({ where: { id: { in: testIds } }, orderBy: { id: "asc" } }),
    sessionTestQuestions: await tx.sessionTestQuestion.findMany({ where: { sessionTestId: { in: testIds } }, orderBy: { id: "asc" } }),
    sessionTestAttempts: await tx.sessionTestAttempt.findMany({ where: { sessionTestId: { in: testIds } }, orderBy: { id: "asc" } }),
    sessionTestAttemptItems: await tx.sessionTestAttemptItem.findMany({ where: { attempt: { sessionTestId: { in: testIds } } }, orderBy: { id: "asc" } }),
    assessmentQuestions: await tx.assessmentQuestion.findMany({ where: { id: { in: questionIds } }, orderBy: { id: "asc" } }),
    assessmentOptions: await tx.assessmentOption.findMany({ where: { questionId: { in: questionIds } }, orderBy: { id: "asc" } }),
    notifications: await tx.notification.findMany({ where: { userId: { in: userIds } }, orderBy: { id: "asc" } }),
  };
  return { users, userIds, profiles, replaceProfileIds, classIds, requestIds, testIds, questionIds, reportIds, snapshot,
    protectedClasses: candidates.length - classes.length, protectedRequests: requests.length - requestIds.length,
    preservedNonSeedAccounts: allUsers.length - users.length,
    fingerprint: digest({ revision: REBUILD_REVISION, users, snapshot }) };
}

async function validateBank(tx: Tx) {
  const source = loadQuestionBank();
  const canonicalIds = source.questions.map(q => q.id);
  const rows = await tx.assessmentQuestion.findMany({ where: { id: { in: canonicalIds } }, include: { options: { orderBy: { position: "asc" } } }, orderBy: { id: "asc" } });
  if (rows.length !== source.questions.length) throw new SeedRebuildError("Import the complete canonical question bank before rebuilding demo activity.");
  const original = new Map(source.questions.map(q => [q.id, q]));
  for (const q of rows) {
    const wanted = original.get(q.id)!;
    if (!q.active || q.origin !== "BANK" || q.subject !== wanted.subject || q.topic !== wanted.topic || q.prompt !== wanted.prompt || q.explanation !== wanted.explanation
      || JSON.stringify(q.options.map(o => [o.text, o.isCorrect])) !== JSON.stringify(wanted.options.map(o => [o.text, o.isCorrect]))) {
      throw new SeedRebuildError(`Canonical question ${q.id} was edited or disabled. Reconcile its version explicitly before rebuilding; approvals will not be overwritten.`);
    }
  }
  const approved = await tx.assessmentQuestion.count({ where: qualificationQuestionWhere({ id: { in: canonicalIds } }) });
  return { rows, fingerprint: digest(rows), approved };
}

/** Read-only plan or one atomic, recoverable replacement of the seeded activity graph. */
export async function rebuildCurriculumData(db: PrismaClient, input: {
  adminId: string; operationId: string; reason: string; apply?: boolean; expectedFingerprint?: string;
}) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(input.operationId) || input.reason.trim().length < 20 || input.reason.length > 1000) throw new SeedRebuildError("Provide a valid operation ID and an explicit reason.", 400);
  const recipe = curriculumDemoRecipe();
  // Passwords of existing users never change. New fallback demo accounts have
  // random passwords unless an operator explicitly configures a demo password.
  const newPasswordHash = input.apply ? await bcrypt.hash(process.env.SEED_DEMO_PASSWORD || randomBytes(32).toString("base64url"), 10) : "";
  return db.$transaction(async tx => {
    const actor = await tx.user.findFirst({ where: { id: input.adminId, role: "SUPER_ADMIN", status: "ACTIVE" }, select: { id: true } });
    if (!actor) throw new SeedRebuildError("An active super administrator is required.", 403);
    const prior = await tx.seedDataRebuild.findUnique({ where: { id: input.operationId }, select: { revision: true, summary: true } });
    if (prior) {
      if (prior.revision !== REBUILD_REVISION) throw new SeedRebuildError("Operation ID already belongs to a different revision.");
      return { alreadyApplied: true, summary: prior.summary };
    }
    // Serialize rebuilds; Serializable inventory reads protect the affected graph.
    // Account rows remain present, preserving credentials and session validity.
    if (input.apply) await tx.$queryRaw`SELECT id FROM users WHERE role = 'SUPER_ADMIN' ORDER BY id FOR UPDATE`;
    const state = await inventory(tx);
    const bank = await validateBank(tx);
    const fingerprint = digest([state.fingerprint, bank.fingerprint]);
    const expected = { subjects: SUBJECT_CATALOG.length, topics: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0), gradeAssociations: recipe.length,
      approvedQuestions: bank.approved, bankQuestions: bank.rows.length, classes: recipe.length + 6, requests: recipe.length, sessionTests: recipe.length + 6 };
    const plan = { revision: REBUILD_REVISION, fingerprint, operationId: input.operationId, dryRun: !input.apply, expected,
      replace: Object.fromEntries(Object.entries(state.snapshot).map(([name, rows]) => [name, rows.length])),
      preserved: { accounts: state.users.length, nonSeedAccounts: state.preservedNonSeedAccounts, mixedActivityClasses: state.protectedClasses, mixedActivityRequests: state.protectedRequests,
        canonicalQuestions: bank.rows.length, approvedQuestions: bank.approved, administratorLogins: true, platformPolicies: true } };
    if (!input.apply) return plan;
    if (!input.expectedFingerprint || input.expectedFingerprint !== fingerprint) throw new SeedRebuildError("The database changed since the preview. Preview again before applying.");
    // Reused deterministic identities cannot collide with preserved mixed activity.
    const intendedClasses = [...recipe.map(r => r.classId), ...Array.from({ length: 6 }, (_, i) => seedId("history-class", String(i)))];
    if (await tx.tutorClass.count({ where: { id: { in: intendedClasses, notIn: state.classIds } } })) throw new SeedRebuildError("A generated class now contains protected activity. Preserve it and use a new seed revision.");
    const archive = Buffer.from(JSON.stringify({ schemaVersion: 1, revision: REBUILD_REVISION, capturedAt: new Date().toISOString(), tables: state.snapshot }));
    const backupSha256 = createHash("sha256").update(archive).digest("hex");
    const backup = gzipSync(archive);
    // Store the backup in the SAME transaction as the replacement. Never log it.
    await tx.seedDataRebuild.create({ data: { id: input.operationId, revision: REBUILD_REVISION, adminId: input.adminId, reason: input.reason, backup, backupSha256, summary: {} } });
    await tx.completionCertificate.deleteMany({ where: { classId: { in: state.classIds } } });
    await tx.sessionTest.deleteMany({ where: { id: { in: state.testIds } } });
    await tx.topicCertification.deleteMany({ where: { tutorProfileId: { in: state.replaceProfileIds } } });
    await tx.assessmentAttempt.deleteMany({ where: { tutorProfileId: { in: state.replaceProfileIds } } });
    await tx.questionRequest.deleteMany({ where: { tutorProfileId: { in: state.replaceProfileIds } } });
    await tx.topicRequest.deleteMany({ where: { id: { in: state.requestIds } } });
    await tx.report.deleteMany({ where: { id: { in: state.reportIds } } });
    await tx.tutorClass.deleteMany({ where: { id: { in: state.classIds } } });
    await tx.assessmentQuestion.deleteMany({ where: { id: { in: state.questionIds } } });
    await tx.notification.deleteMany({ where: { userId: { in: state.userIds } } });
    await applySubjectCatalog(tx);
    const users = [...state.users];
    const profiles = [...state.profiles];
    async function gradeUser(role: "STUDENT_TUTOR" | "STUDENT_LEARNER", gradeLevel: GradeLevel) {
      const existing = users.filter(u => u.role === role && u.gradeLevel === gradeLevel && u.status === "ACTIVE"
        && (role !== "STUDENT_TUTOR" || !profiles.some(p => p.userId === u.id && !state.replaceProfileIds.includes(p.id)))).sort(byId)[0];
      if (existing) return existing;
      const kind = role === "STUDENT_TUTOR" ? "tutor" : "learner";
      const grade = gradeLevel.slice(6);
      const email = `curriculum.${kind}.grade-${grade}@seed.katuwang.test`;
      if (await tx.user.findUnique({ where: { email }, select: { id: true } })) throw new SeedRebuildError(`Fallback demo ${kind} for grade ${grade} is not active or available. Its account status was preserved.`);
      const prefix = kind === "tutor" ? "TUT" : "STU";
      let anonymousId: string;
      do {
        const count = await tx.idCounter.upsert({ where: { role: kind === "tutor" ? "TUTOR" : "LEARNER" }, create: { role: kind === "tutor" ? "TUTOR" : "LEARNER", count: 1 }, update: { count: { increment: 1 } } });
        anonymousId = `${prefix}-${String(count.count).padStart(4, "0")}`;
      } while (await tx.user.findUnique({ where: { anonymousId }, select: { id: true } }));
      const user = await tx.user.create({ data: { id: seedId("user", email), anonymousId, email, firstName: "Curriculum Demo", lastName: `${kind} Grade ${grade}`, password: newPasswordHash, role, gradeLevel, section: "Curriculum Demo", consentGiven: true, emailVerifiedAt: new Date() },
        select: { id: true, email: true, anonymousId: true, role: true, gradeLevel: true, status: true } });
      users.push(user);
      return user;
    }
    const tutorForGrade = new Map<GradeLevel, string>();
    const learnerForGrade = new Map<GradeLevel, string>();
    for (const grade of ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"] as GradeLevel[]) {
      const tutor = await gradeUser("STUDENT_TUTOR", grade);
      const profile = await tx.tutorProfile.upsert({ where: { userId: tutor.id }, create: { id: seedId("profile", tutor.email), userId: tutor.id }, update: {} });
      tutorForGrade.set(grade, profile.id);
      learnerForGrade.set(grade, (await gradeUser("STUDENT_LEARNER", grade)).id);
    }
    const now = new Date();
    const questions = new Map(bank.rows.map(q => [q.id, q]));
    const data = {
      classes: [] as Prisma.TutorClassCreateManyInput[], topics: [] as Prisma.ClassTopicCreateManyInput[], sessions: [] as Prisma.ClassSessionCreateManyInput[], enrollments: [] as Prisma.ClassEnrollmentCreateManyInput[],
      tests: [] as Prisma.SessionTestCreateManyInput[], links: [] as Prisma.SessionTestQuestionCreateManyInput[], certs: [] as Prisma.TopicCertificationCreateManyInput[],
      requests: [] as Prisma.TopicRequestCreateManyInput[], requestTopics: [] as Prisma.TopicRequestTopicCreateManyInput[], slots: [] as Prisma.TopicRequestSlotCreateManyInput[], histories: [] as Prisma.TopicRequestHistoryCreateManyInput[],
      questionRequests: [] as Prisma.QuestionRequestCreateManyInput[], notifications: [] as Prisma.NotificationCreateManyInput[],
      attempts: [] as Prisma.AssessmentAttemptCreateManyInput[], attemptItems: [] as Prisma.AssessmentAttemptItemCreateManyInput[],
      testAttempts: [] as Prisma.SessionTestAttemptCreateManyInput[], testItems: [] as Prisma.SessionTestAttemptItemCreateManyInput[],
      ownedQuestions: [] as Prisma.AssessmentQuestionCreateManyInput[], ownedOptions: [] as Prisma.AssessmentOptionCreateManyInput[],
      reports: [] as Prisma.ReportCreateManyInput[], violations: [] as Prisma.ReportViolationCreateManyInput[],
      appeals: [] as Prisma.ClassAppealCreateManyInput[], recommendations: [] as Prisma.ClassRecommendationCreateManyInput[],
    };
    const topicCertKeys = new Set<string>();
    for (const [i, r] of recipe.entries()) {
      const tutorProfileId = tutorForGrade.get(r.gradeLevel as GradeLevel)!;
      const learnerId = learnerForGrade.get(r.gradeLevel as GradeLevel)!;
      const sessionId = seedId("session", r.key), testId = seedId("test", r.key);
      const scheduledAt = new Date(now.getTime() + (2 + i % 28) * day);
      scheduledAt.setUTCHours(7 + (i % 3), 0, 0, 0); // 15:00–17:00 Asia/Manila
      const slotDate = scheduledAt.toISOString().slice(0, 10);
      const slotDay = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][scheduledAt.getUTCDay()];
      data.classes.push({ id: r.classId, code: `CUR-${String(i + 1).padStart(4, "0")}`, tutorProfileId, subject: r.subject, gradeLevel: r.gradeLevel as GradeLevel,
        description: `${DEMO_TAG} ${r.subjectName}: ${r.topic}. Seeded walkthrough data, not a real tutoring appointment.`, maxStudents: i % 10 === 0 ? 1 : 4, status: "SCHEDULED", published: true });
      data.topics.push({ id: seedId("class-topic", r.key), classId: r.classId, topic: r.topic });
      data.sessions.push({ id: sessionId, classId: r.classId, topic: r.topic, scheduledAt, duration: 60, status: "SCHEDULED" });
      data.enrollments.push({ id: seedId("enrollment", r.key), classId: r.classId, learnerId });
      data.tests.push({ id: testId, sessionId, title: `${DEMO_TAG} ${r.topic}`, instructions: "Seeded practice test using the current topic's question bank.", status: "DRAFT" });
      for (const [position, q] of r.questions.slice(0, 5).entries()) data.links.push({ id: seedId("test-link", r.key + position), sessionTestId: testId, questionId: q.id, position });
      const certKey = JSON.stringify([tutorProfileId, r.subject, r.topic]);
      if (!topicCertKeys.has(certKey)) {
        topicCertKeys.add(certKey);
        data.certs.push({ id: seedId("certification", certKey), tutorProfileId, subject: r.subject, topic: r.topic, status: "PENDING", reviewNote: `${DEMO_TAG} Awaiting a real tutor assessment. No qualification is granted by seeding.` });
        data.questionRequests.push({ id: seedId("question-request", certKey), tutorProfileId, subject: r.subject, topic: r.topic, note: `${DEMO_TAG} Additional practice coverage for ${r.topic}.`, status: "OPEN" });
      }
      const status = i % 4 === 0 ? "ENROLLED" as const : "OPEN" as const;
      data.requests.push({ id: r.requestId, learnerId, subject: r.subject, gradeLevel: r.gradeLevel as GradeLevel, note: `${DEMO_TAG} Practice support for ${r.topic}.`, status,
        directedTutorProfileId: tutorProfileId, fulfilledClassId: status === "ENROLLED" ? r.classId : null, lastSubmittedAt: now, expiresAt: new Date(now.getTime() + 3 * day) });
      data.requestTopics.push({ id: seedId("request-topic", r.key), requestId: r.requestId, topic: r.topic });
      data.slots.push({ id: seedId("request-slot", r.key), requestId: r.requestId, date: slotDate, day: slotDay, startTime: `${String(scheduledAt.getUTCHours() + 8).padStart(2, "0")}:00`, endTime: `${String(scheduledAt.getUTCHours() + 9).padStart(2, "0")}:00` });
      const request = data.requests[data.requests.length - 1];
      data.histories.push({ id: seedId("request-history", r.key), requestId: r.requestId, actorId: input.adminId, eventType: "SEEDED", before: Prisma.JsonNull,
        after: JSON.parse(JSON.stringify({ ...request, topics: [r.topic], slots: [data.slots[data.slots.length - 1]] })) });
    }
    // Six historical examples feed progress charts. Synthetic results explicitly
    // cannot certify tutors, issue completion certificates, or send emails.
    for (let i = 0; i < 6; i++) {
      const grade = `GRADE_${i + 7}` as GradeLevel;
      const r = recipe.find(r => r.gradeLevel === grade)!;
      const tutorProfileId = tutorForGrade.get(grade)!, learnerId = learnerForGrade.get(grade)!;
      const classId = seedId("history-class", String(i)), sessionId = seedId("history-session", String(i)), testId = seedId("history-test", String(i));
      const completed = i % 3 !== 2;
      const classStatus = completed ? "COMPLETED" as const : i === 5 ? "SUSPENDED" as const : "CANCELLED" as const;
      const past = new Date(now.getTime() - (7 + i) * day);
      data.classes.push({ id: classId, code: `CUR-H${i + 1}`, tutorProfileId, subject: r.subject, gradeLevel: grade, maxStudents: 4, published: true,
        description: `${DEMO_TAG} Historical ${classStatus.toLowerCase()} practice: ${r.topic}.`, status: classStatus,
        suspendedReason: classStatus === "SUSPENDED" ? `${DEMO_TAG} Synthetic moderation example.` : null, completedAt: completed ? past : null });
      data.topics.push({ id: seedId("history-topic", String(i)), classId, topic: r.topic });
      data.sessions.push({ id: sessionId, classId, topic: r.topic, scheduledAt: past, duration: 60, status: completed ? "COMPLETED" : "CANCELLED" });
      data.enrollments.push({ id: seedId("history-enrollment", String(i)), classId, learnerId, enrolledAt: new Date(past.getTime() - day) });
      data.tests.push({ id: testId, sessionId, title: `${DEMO_TAG} Historical ${r.topic}`, status: completed ? "CLOSED" : "DRAFT", publishedAt: completed ? past : null, closedAt: completed ? past : null });
      const qs = r.questions.slice(0, 5).map(q => questions.get(q.id)!);
      for (const [position, q] of qs.entries()) data.links.push({ id: seedId("history-link", `${i}-${position}`), sessionTestId: testId, questionId: q.id, position });
      if (completed) for (const kind of ["PRE", "POST"] as const) {
        const attemptId = seedId("session-attempt", `${i}-${kind}`);
        const correctCount = kind === "PRE" ? 2 : 4;
        data.testAttempts.push({ id: attemptId, sessionTestId: testId, learnerId, kind, status: "SUBMITTED", totalQuestions: 5, correctCount, scorePercent: correctCount * 20, startedAt: past, submittedAt: past });
        for (const [position, q] of qs.entries()) {
          const correct = position < correctCount;
          data.testItems.push({ id: seedId("session-item", `${i}-${kind}-${position}`), attemptId, questionId: q.id, position,
            selectedOptionId: q.options.find(o => o.isCorrect === correct)!.id, isCorrect: correct });
        }
      }
      const attemptId = seedId("assessment-attempt", String(i));
      data.attempts.push({ id: attemptId, tutorProfileId, subject: r.subject, topic: r.topic, attemptNo: 1, status: "FAILED", certificationEligible: false, questionCount: 5, correctCount: 2, scorePercent: 40, passPercent: 80, startedAt: past, submittedAt: past });
      for (const [position, q] of qs.entries()) data.attemptItems.push({ id: seedId("assessment-item", `${i}-${position}`), attemptId, questionId: q.id, position, selectedOptionId: q.options.find(o => o.isCorrect === (position < 2))!.id, isCorrect: position < 2 });
      const q = qs[0], questionId = seedId("owned-question", String(i));
      const tutorUserId = (await tx.tutorProfile.findUniqueOrThrow({ where: { id: tutorProfileId }, select: { userId: true } })).userId;
      data.ownedQuestions.push({ id: questionId, subject: r.subject, topic: r.topic, prompt: `${DEMO_TAG} ${q.prompt}`, explanation: q.explanation, origin: "TUTOR", reviewStatus: "DEMO", createdById: tutorUserId, ownerTutorProfileId: tutorProfileId });
      q.options.forEach(o => data.ownedOptions.push({ id: seedId("owned-option", `${i}-${o.position}`), questionId, text: o.text, isCorrect: o.isCorrect, position: o.position }));
      data.notifications.push({ id: seedId("notification", String(i)), userId: learnerId, type: "CLASS_UPDATE", message: `${DEMO_TAG} Current curriculum practice classes are ready.`, link: "/learner/classes" });
      const reportId = seedId("report", String(i));
      data.reports.push({ id: reportId, reporterId: learnerId, targetType: "CLASS", classId,
        details: `${DEMO_TAG} Synthetic class report for the moderation walkthrough.`, status: "DISMISSED", reviewedById: input.adminId, reviewedAt: now,
        resolutionNote: `${DEMO_TAG} Demonstration only; no real conduct allegation.` });
      data.violations.push({ id: seedId("report-violation", String(i)), reportId, type: "OTHER" });
      data.recommendations.push({ id: seedId("recommendation", String(i)), classId, learnerId, adminId: input.adminId,
        note: `${DEMO_TAG} Historical practice recommendation.`, dismissedAt: now });
      if (classStatus === "SUSPENDED") data.appeals.push({ id: seedId("appeal", String(i)), classId, tutorProfileId,
        reason: `${DEMO_TAG} Synthetic appeal for the moderation walkthrough.`, status: "PENDING" });
    }
    const batch = async <T,>(rows: T[], write: (chunk: T[]) => Promise<unknown>) => { for (let i = 0; i < rows.length; i += 100) await write(rows.slice(i, i + 100)); };
    await batch(data.classes, rows => tx.tutorClass.createMany({ data: rows }));
    await batch(data.topics, rows => tx.classTopic.createMany({ data: rows }));
    await batch(data.sessions, rows => tx.classSession.createMany({ data: rows }));
    await batch(data.enrollments, rows => tx.classEnrollment.createMany({ data: rows }));
    await batch(data.tests, rows => tx.sessionTest.createMany({ data: rows }));
    await batch(data.links, rows => tx.sessionTestQuestion.createMany({ data: rows }));
    await batch(data.certs, rows => tx.topicCertification.createMany({ data: rows }));
    await batch(data.requests, rows => tx.topicRequest.createMany({ data: rows }));
    await batch(data.requestTopics, rows => tx.topicRequestTopic.createMany({ data: rows }));
    await batch(data.slots, rows => tx.topicRequestSlot.createMany({ data: rows }));
    await batch(data.histories, rows => tx.topicRequestHistory.createMany({ data: rows }));
    await batch(data.questionRequests, rows => tx.questionRequest.createMany({ data: rows }));
    await batch(data.notifications, rows => tx.notification.createMany({ data: rows }));
    await batch(data.attempts, rows => tx.assessmentAttempt.createMany({ data: rows }));
    await batch(data.attemptItems, rows => tx.assessmentAttemptItem.createMany({ data: rows }));
    await batch(data.testAttempts, rows => tx.sessionTestAttempt.createMany({ data: rows }));
    await batch(data.testItems, rows => tx.sessionTestAttemptItem.createMany({ data: rows }));
    await batch(data.ownedQuestions, rows => tx.assessmentQuestion.createMany({ data: rows }));
    await batch(data.ownedOptions, rows => tx.assessmentOption.createMany({ data: rows }));
    await batch(data.reports, rows => tx.report.createMany({ data: rows }));
    await batch(data.violations, rows => tx.reportViolation.createMany({ data: rows }));
    await batch(data.appeals, rows => tx.classAppeal.createMany({ data: rows }));
    await batch(data.recommendations, rows => tx.classRecommendation.createMany({ data: rows }));
    // Only unreferenced legacy catalog names can be removed. All surviving
    // histories retain their inactive catalog entries and original strings.
    const references = new Set<string>();
    for (const row of await tx.tutorClass.findMany({ select: { subject: true, topics: { select: { topic: true } }, sessions: { select: { topic: true } } } })) for (const topic of [...row.topics, ...row.sessions]) references.add(pair(row.subject, topic.topic));
    for (const row of await tx.topicRequest.findMany({ select: { subject: true, topics: { select: { topic: true } } } })) for (const topic of row.topics) references.add(pair(row.subject, topic.topic));
    for (const rows of [await tx.assessmentQuestion.findMany({ select: { subject: true, topic: true } }), await tx.assessmentAttempt.findMany({ select: { subject: true, topic: true } }),
      await tx.topicCertification.findMany({ select: { subject: true, topic: true } }), await tx.questionRequest.findMany({ select: { subject: true, topic: true } })]) for (const row of rows) references.add(pair(row.subject, row.topic));
    const obsoleteTopics = await tx.topic.findMany({ where: { active: false }, include: { subject: { select: { slug: true } } } });
    const topicIdsToRemove = obsoleteTopics.filter(t => !references.has(pair(t.subject.slug, t.name))).map(t => t.id);
    await tx.topic.deleteMany({ where: { id: { in: topicIdsToRemove } } });
    const obsoleteSubjects = await tx.subject.findMany({ where: { active: false }, include: { _count: { select: { topics: true } } } });
    await tx.subject.deleteMany({ where: { id: { in: obsoleteSubjects.filter(s => s._count.topics === 0).map(s => s.id) } } });
    const summary = { ...plan, dryRun: false, created: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
      removedLegacyQuestions: state.questionIds.length, removedLegacyTopics: topicIdsToRemove.length, backupSha256, archivedBytes: archive.length,
      syntheticTutorCertificationsGranted: 0, emailsSent: 0 };
    await tx.seedDataRebuild.update({ where: { id: input.operationId }, data: { summary: JSON.parse(JSON.stringify(summary)) } });
    await tx.auditLog.create({ data: { adminId: input.adminId, action: "CURRICULUM_SEED_REBUILT", targetType: "SEED_DATA_REBUILD", targetId: input.operationId,
      reason: JSON.stringify({ reason: input.reason, revision: REBUILD_REVISION, backupSha256, created: summary.created, preserved: plan.preserved }) } });
    return summary;
  }, { timeout: 180000, maxWait: 10000, isolationLevel: "Serializable" });
}
