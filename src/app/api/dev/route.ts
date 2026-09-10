import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role, GradeLevel, ClassStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateClassCode } from "@/lib/idGenerator";
import { registerAccount } from "@/lib/registration";
import { SUBJECT_TOPICS, SUBJECT_SLUGS } from "@/lib/subjectTopics";

// ─────────────────────────────────────────────────────────────────────────────
// Dev-only data factory. Spawns throwaway users / classes / enrolments / topic
// requests against the CURRENT database, without re-running prisma/seed.ts.
//
// Hard-404s in production. Everything it creates uses the "@dev.test" email
// domain so `wipeDevData` can clean up without touching seed data.
// ─────────────────────────────────────────────────────────────────────────────

const DEV_PASSWORD = "password123";
const DEV_EMAIL_DOMAIN = "@dev.test";

const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Miguel", "Sofia", "Carlos", "Isabella", "Angelo", "Camille",
  "Marco", "Bea", "Paolo", "Liza", "Rafael", "Nicole", "Diego", "Andrea", "Emmanuel", "Patricia",
];
const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Ramos", "Flores",
  "Villanueva", "Fernandez", "De Leon", "Aquino", "Castillo", "Navarro", "Salazar", "Domingo",
];
const SECTIONS = ["Rizal", "Bonifacio", "Mabini", "Aguinaldo", "Luna", "Del Pilar", "Jacinto"];
const GRADES: GradeLevel[] = [
  "GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12",
];
const SUBJECTS = SUBJECT_SLUGS;

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const sample = <T,>(arr: readonly T[], n: number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
};
const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** A future date `days` out, at `hour`:00 local. */
function inDays(days: number, hour = 15): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function devGuard(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return null;
}

// ─── GET: snapshot for the UI ────────────────────────────────────────────────

export async function GET() {
  const blocked = devGuard();
  if (blocked) return blocked;

  const [tutors, learners, admins, classes] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT_TUTOR" },
      select: { id: true, anonymousId: true, firstName: true, lastName: true, email: true },
      orderBy: { anonymousId: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT_LEARNER" },
      select: { id: true, anonymousId: true, firstName: true, lastName: true, email: true },
      orderBy: { anonymousId: "asc" },
    }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.tutorClass.findMany({
      select: {
        id: true,
        code: true,
        subject: true,
        status: true,
        maxStudents: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const devUserCount = await prisma.user.count({
    where: { email: { endsWith: DEV_EMAIL_DOMAIN } },
  });

  return NextResponse.json({
    counts: { tutors: tutors.length, learners: learners.length, admins, classes: classes.length, devUsers: devUserCount },
    tutors,
    learners,
    classes,
    meta: { password: DEV_PASSWORD, devEmailDomain: DEV_EMAIL_DOMAIN },
  });
}

// ─── POST: run one factory action ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const blocked = devGuard();
  if (blocked) return blocked;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = String(body.action ?? "");

  try {
    switch (action) {
      case "createUsers":
        return await createUsers(body);
      case "createClass":
        return await createClass(body);
      case "enroll":
        return await enroll(body);
      case "createTopicRequests":
        return await createTopicRequests(body);
      case "wipeDevData":
        return await wipeDevData();
      default:
        return NextResponse.json({ error: `Unknown action: ${action || "(none)"}.` }, { status: 400 });
    }
  } catch (error) {
    console.error("Dev factory error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── Actions ────────────────────────────────────────────────────────────────

async function createUsers(body: Record<string, unknown>) {
  const role = String(body.role ?? "") as Role;
  if (!["STUDENT_LEARNER", "STUDENT_TUTOR", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "role must be STUDENT_LEARNER, STUDENT_TUTOR or ADMIN." }, { status: 400 });
  }
  const count = clampInt(body.count, 1, 50, 1);
  const fixedGrade = GRADES.includes(body.gradeLevel as GradeLevel) ? (body.gradeLevel as GradeLevel) : null;
  const fixedSection = typeof body.section === "string" && body.section.trim() ? body.section.trim() : null;
  // When true, learners/tutors are created PENDING so they land in the admin
  // "Registration Approvals" queue instead of being immediately active.
  const pending = body.pending === true;

  const stamp = Date.now().toString(36);
  const created: { anonymousId: string; email: string; name: string }[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const email = `dev.${role.toLowerCase()}.${stamp}.${i}${DEV_EMAIL_DOMAIN}`;
    const gradeLevel = fixedGrade ?? pick(GRADES);
    const section = fixedSection ?? pick(SECTIONS);

    if (role === "ADMIN") {
      // Registration has no admin path — admins are provisioned directly.
      await prisma.user.create({
        data: {
          anonymousId: `ADM-DEV-${stamp}-${i}`,
          firstName,
          lastName,
          email,
          password: await bcrypt.hash(DEV_PASSWORD, 12),
          role,
          gradeLevel,
          section,
          consentGiven: true,
        },
      });
      created.push({ anonymousId: `ADM-DEV-${stamp}-${i}`, email, name: `${firstName} ${lastName}` });
      continue;
    }

    // Learners and tutors go through the real registration path, so they get
    // the same anonymous ID, tutor profile and invariants a public signup does.
    const account = await registerAccount({
      type: role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER",
      firstName,
      lastName,
      email,
      password: DEV_PASSWORD,
      gradeLevel,
      section,
      consentGiven: true,
      requireApproval: pending,
    });
    if (!account.ok) {
      return NextResponse.json({ error: `Email collision for ${email} — try again.` }, { status: 409 });
    }
    created.push({ anonymousId: account.anonymousId, email, name: `${firstName} ${lastName}` });
  }

  const suffix =
    pending && role !== "ADMIN"
      ? " Status: PENDING — see Admin → Registration Approvals."
      : ` Password: ${DEV_PASSWORD}`;
  return NextResponse.json(
    { message: `Created ${created.length} ${role} account(s).${suffix}`, created },
    { status: 201 },
  );
}

async function createClass(body: Record<string, unknown>) {
  let tutorProfileId: string;
  let tutorUserId = typeof body.tutorUserId === "string" ? body.tutorUserId : "";

  if (tutorUserId) {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId: tutorUserId }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "That tutor has no tutor profile." }, { status: 404 });
    tutorProfileId = profile.id;
  } else {
    const profile = await prisma.tutorProfile.findFirst({ select: { id: true, userId: true } });
    if (!profile) return NextResponse.json({ error: "No tutors exist yet — create a tutor first." }, { status: 400 });
    tutorProfileId = profile.id;
    tutorUserId = profile.userId;
  }

  const subject: string = SUBJECTS.includes(body.subject as string) ? (body.subject as string) : pick(SUBJECTS);
  const topicCount = clampInt(body.topicCount, 1, Math.min(6, SUBJECT_TOPICS[subject].length), 2);
  const sessionCount = clampInt(body.sessionCount, 1, 10, 2);
  const maxStudents = clampInt(body.maxStudents, 1, 10, 3);
  const gradeLevel = GRADES.includes(body.gradeLevel as GradeLevel) ? (body.gradeLevel as GradeLevel) : null;
  const published = body.published === undefined ? true : Boolean(body.published);
  const statusInput = body.status as ClassStatus;
  const status: ClassStatus = ["SCHEDULED", "COMPLETED", "CANCELLED"].includes(statusInput) ? statusInput : "SCHEDULED";

  const topics = sample(SUBJECT_TOPICS[subject], topicCount);
  const past = status === "COMPLETED";
  const sessions = Array.from({ length: sessionCount }, (_, i) => ({
    topic: pick(topics),
    scheduledAt: past ? inDays(-(i + 1) * 2, 15) : inDays((i + 1) * 2, 15),
    duration: pick([30, 45, 60, 90]),
    status: past ? ("COMPLETED" as const) : status === "CANCELLED" ? ("CANCELLED" as const) : ("SCHEDULED" as const),
  }));

  const code = await generateClassCode();
  const newClass = await prisma.tutorClass.create({
    data: {
      tutorProfileId,
      code,
      subject,
      gradeLevel,
      description: `Dev factory class — ${subject} (${topics.join(", ")}).`,
      maxStudents,
      published,
      status,
      topics: { create: topics.map((topic) => ({ topic })) },
      sessions: { create: sessions },
    },
    include: { topics: true, sessions: true },
  });

  return NextResponse.json(
    {
      message: `Created class ${newClass.code} (${subject}) for tutor ${tutorUserId}.`,
      class: { id: newClass.id, code: newClass.code, subject, topics, sessions: newClass.sessions.length, maxStudents },
    },
    { status: 201 },
  );
}

async function enroll(body: Record<string, unknown>) {
  const classId = typeof body.classId === "string" ? body.classId : "";
  if (!classId) return NextResponse.json({ error: "classId is required." }, { status: 400 });

  const cls = await prisma.tutorClass.findUnique({
    where: { id: classId },
    select: { id: true, code: true, maxStudents: true, enrollments: { select: { learnerId: true } } },
  });
  if (!cls) return NextResponse.json({ error: "Class not found." }, { status: 404 });

  const enrolledIds = new Set(cls.enrollments.map((e) => e.learnerId));
  const openSlots = cls.maxStudents - enrolledIds.size;
  if (openSlots <= 0) return NextResponse.json({ error: `Class ${cls.code} is full.` }, { status: 409 });

  let learnerIds: string[];
  if (typeof body.learnerId === "string" && body.learnerId) {
    learnerIds = [body.learnerId];
  } else {
    const count = clampInt(body.count, 1, openSlots, 1);
    const candidates = await prisma.user.findMany({
      where: { role: "STUDENT_LEARNER", id: { notIn: [...enrolledIds] } },
      select: { id: true },
    });
    learnerIds = sample(candidates.map((c) => c.id), count);
  }

  const results: string[] = [];
  for (const learnerId of learnerIds) {
    if (enrolledIds.has(learnerId)) continue;
    if (enrolledIds.size >= cls.maxStudents) break;
    await prisma.classEnrollment.create({ data: { classId: cls.id, learnerId } });
    enrolledIds.add(learnerId);
    results.push(learnerId);
  }

  return NextResponse.json({
    message: `Enrolled ${results.length} learner(s) into ${cls.code}.`,
    enrolled: results,
  });
}

async function createTopicRequests(body: Record<string, unknown>) {
  const count = clampInt(body.count, 1, 40, 3);
  const learners = await prisma.user.findMany({
    where: { role: "STUDENT_LEARNER" },
    select: { id: true, gradeLevel: true },
  });
  if (learners.length === 0) {
    return NextResponse.json({ error: "No learners exist yet — create a learner first." }, { status: 400 });
  }

  let made = 0;
  for (let i = 0; i < count; i++) {
    const learner = pick(learners);
    const subject = pick(SUBJECTS);
    const topics = sample(SUBJECT_TOPICS[subject], Math.floor(Math.random() * 2) + 1);
    await prisma.topicRequest.create({
      data: {
        learnerId: learner.id,
        subject,
        gradeLevel: learner.gradeLevel,
        note: "Dev factory class request.",
        status: "OPEN",
        topics: { create: topics.map((topic) => ({ topic })) },
        slots: { create: [{ day: "MONDAY", startTime: "15:00", endTime: "17:00" }] },
      },
    });
    made++;
  }

  return NextResponse.json({ message: `Created ${made} open class request(s).` }, { status: 201 });
}

async function wipeDevData() {
  const devUsers = await prisma.user.findMany({
    where: { email: { endsWith: DEV_EMAIL_DOMAIN } },
    select: { id: true },
  });
  if (devUsers.length === 0) {
    return NextResponse.json({ message: "No @dev.test users to remove." });
  }
  const ids = devUsers.map((u) => u.id);

  const removed = await prisma.$transaction(async (tx) => {
    // TutorProfile.user has no cascade, so drop the profiles first — that DOES
    // cascade to their TutorClass / TopicCertification / AssessmentAttempt rows.
    await tx.tutorProfile.deleteMany({ where: { userId: { in: ids } } });
    // Learner enrolments, topic requests, notifications, reset tokens all cascade
    // from User, so the user delete finishes the job.
    const { count } = await tx.user.deleteMany({ where: { id: { in: ids } } });
    return count;
  });

  return NextResponse.json({ message: `Removed ${removed} @dev.test user(s) and their owned data.` });
}
