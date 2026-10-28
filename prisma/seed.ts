import { seedSubjectCatalog } from "./seedSubjectCatalog";
import { recordRequestHistory, requestDeadline, requestSnapshot } from "../src/lib/topicRequestHistory";
import {
  Role,
  GradeLevel,
  ClassStatus,
  SessionStatus,
  User,
  TutorProfile,
  TopicRequestStatus,
  AccountStatus,
  ClassAppealStatus,
  ReportStatus,
  ReportTargetType,
  ReportViolationType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { SUBJECT_TOPICS } from "../src/lib/subjectTopics";
import { prisma } from "../src/lib/prisma";

// .env holds DATABASE_URL; .env.seed (optional, gitignored) holds the SEED_* volume knobs.
loadEnv();
loadEnv({ path: ".env.seed" });

const DUMMY_PASSWORD = "password123";

// ─── Bulk generation config (opt-in via env vars) ────────────────────────────
// Curated demo accounts and records are always created. These add procedurally-
// generated accounts/classes/records ON TOP, to reach the given totals.
const GEN = {
  tutors: Math.max(0, Number(process.env.SEED_TUTORS ?? 10) | 0),
  learners: Math.max(0, Number(process.env.SEED_LEARNERS ?? 10) | 0),
  classes: Math.max(0, Number(process.env.SEED_CLASSES ?? 15) | 0),
  topicRequests: Math.max(0, Number(process.env.SEED_TOPIC_REQUESTS ?? 10) | 0),
  questionsPerTopic: Math.max(0, Number(process.env.SEED_QUESTIONS_PER_TOPIC ?? 15) | 0),
  reports: Math.max(0, Number(process.env.SEED_REPORTS ?? 6) | 0),
  classAppeals: Math.max(0, Number(process.env.SEED_CLASS_APPEALS ?? 3) | 0),
  auditLogs: Math.max(0, Number(process.env.SEED_AUDIT_LOGS ?? 15) | 0),
  recommendations: Math.max(0, Number(process.env.SEED_RECOMMENDATIONS ?? 5) | 0),
  chatbotMisses: Math.max(0, Number(process.env.SEED_CHATBOT_MISSES ?? 8) | 0),
};

// ─── Deterministic RNG so re-runs produce the same dataset ───────────────────
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260829);
const rand = {
  int: (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min,
  pick: <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)],
  chance: (p: number) => rng() < p,
  sample: <T>(arr: readonly T[], n: number): T[] => {
    const pool = [...arr];
    const out: T[] = [];
    while (out.length < n && pool.length > 0) {
      out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
    return out;
  },
};

const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Miguel", "Sofia", "Carlos", "Isabella", "Angelo", "Camille",
  "Marco", "Bea", "Paolo", "Liza", "Rafael", "Nicole", "Diego", "Andrea", "Emmanuel", "Patricia",
  "Kevin", "Trisha", "Nathaniel", "Erika", "Gabriel", "Danica", "Christian", "Kaye", "Lorenzo", "Mika",
  "Julian", "Hannah", "Enrico", "Roselle", "Vincent", "Aira", "Dominic", "Yumi", "Francis", "Klarisse",
];
const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Ramos", "Flores",
  "Villanueva", "Fernandez", "De Leon", "Aquino", "Castillo", "Navarro", "Salazar", "Domingo", "Rosales", "Gutierrez",
  "Aguilar", "Del Rosario", "Mercado", "Pascual", "Rivera", "Andrada", "Bernardo", "Espino", "Lim", "Uy",
];
const SECTIONS = ["Rizal", "Bonifacio", "Mabini", "Aguinaldo", "Luna", "Del Pilar", "Jacinto", "Silang", "Malvar", "Tandang Sora"];
const ALL_GRADES: GradeLevel[] = ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"];
const ALL_SUBJECTS = Object.keys(SUBJECT_TOPICS) as string[];
const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const REQUEST_NOTES = [
  "I struggle most with word problems.",
  "Preparing for the quarterly exam.",
  "Need a slower pace with lots of examples.",
  "Missed the class discussion, hoping to catch up.",
  "Would prefer a one-on-one session.",
];

function pad(n: number, width = 3) {
  return String(n).padStart(width, "0");
}

// ─── Real-time Logging Helper ───────────────────────────────────────────────
const log = {
  header: (title: string) => {
    console.log(`\n\x1b[1m\x1b[36m▶ ${title}\x1b[0m`);
  },
  add: (type: string, message: string) => {
    console.log(`  \x1b[32m[+] ${type.padEnd(18)}\x1b[0m ${message}`);
  },
  update: (type: string, message: string) => {
    console.log(`  \x1b[33m[~] ${type.padEnd(18)}\x1b[0m ${message}`);
  },
  exist: (type: string, message: string) => {
    console.log(`  \x1b[90m[=] ${type.padEnd(18)} ${message}\x1b[0m`);
  },
  info: (type: string, message: string) => {
    console.log(`  \x1b[34m[i] ${type.padEnd(18)}\x1b[0m ${message}`);
  },
};

// ─── Class code tracking & allocation (idempotent across runs) ───────────────
let maxObservedCodeNum = 0;

function recordCodeNumber(code: string) {
  const match = code.match(/^C-(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > maxObservedCodeNum) {
      maxObservedCodeNum = num;
    }
  }
}

async function initMaxClassCode(): Promise<void> {
  const counter = await prisma.idCounter.findUnique({ where: { role: "CLASS" } });
  if (counter && counter.count > maxObservedCodeNum) {
    maxObservedCodeNum = counter.count;
  }
  const classes = await prisma.tutorClass.findMany({ select: { code: true } });
  for (const c of classes) {
    recordCodeNumber(c.code);
  }
}

async function allocateClassCode(preferredCode?: string): Promise<string> {
  if (preferredCode) {
    const taken = await prisma.tutorClass.findUnique({
      where: { code: preferredCode },
      select: { id: true },
    });
    if (!taken) {
      recordCodeNumber(preferredCode);
      return preferredCode;
    }
  }

  while (true) {
    maxObservedCodeNum++;
    const candidate = `C-${pad(maxObservedCodeNum, 4)}`;
    const taken = await prisma.tutorClass.findUnique({
      where: { code: candidate },
      select: { id: true },
    });
    if (!taken) {
      return candidate;
    }
  }
}

// ─── Anonymous ID helper (collision-safe) ───────────────────────────────────

async function nextAnonymousId(role: "TUTOR" | "LEARNER"): Promise<string> {
  const prefix = role === "TUTOR" ? "TUT" : "STU";
  while (true) {
    const updated = await prisma.idCounter.update({
      where: { role },
      data: { count: { increment: 1 } },
    });
    const candidate = `${prefix}-${String(updated.count).padStart(4, "0")}`;
    const exists = await prisma.user.findUnique({ where: { anonymousId: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
}

// ─── Dummy account definitions ──────────────────────────────────────────────

interface TutorSeed {
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel: GradeLevel;
  section: string;
  status?: AccountStatus;
  statusReason?: string | null;
  statusExpiresAt?: Date | null;
  statusUpdatedAt?: Date | null;
  topicCertifications: {
    subject: string;
    topic: string;
    certified: boolean;
    rejected?: boolean;
    reviewNote?: string;
  }[];
}

interface LearnerSeed {
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel: GradeLevel;
  section: string;
  status?: AccountStatus;
  statusReason?: string | null;
  statusExpiresAt?: Date | null;
  statusUpdatedAt?: Date | null;
}

const TUTORS: TutorSeed[] = [
  {
    email: "maria.santos@katuwang.test",
    firstName: "Maria",
    lastName: "Santos",
    gradeLevel: "GRADE_10",
    section: "Rizal",
    topicCertifications: [
      { subject: "MATH", topic: "Algebraic Expressions", certified: true },
      { subject: "MATH", topic: "Linear Equations & Inequalities", certified: true },
      { subject: "MATH", topic: "Geometry & Measurement", certified: true },
      { subject: "MATH", topic: "Fractions & Decimals", certified: true },
    ],
  },
  {
    email: "jose.reyes@katuwang.test",
    firstName: "Jose",
    lastName: "Reyes",
    gradeLevel: "GRADE_11",
    section: "Bonifacio",
    topicCertifications: [
      { subject: "ENGLISH", topic: "Grammar & Sentence Structure", certified: true },
      { subject: "ENGLISH", topic: "Reading Comprehension", certified: true },
      { subject: "ENGLISH", topic: "Essay & Paragraph Writing", certified: true },
      { subject: "ENGLISH", topic: "Public Speaking & Oral Communication", certified: true },
    ],
  },
  {
    email: "ana.cruz@katuwang.test",
    firstName: "Ana",
    lastName: "Cruz",
    gradeLevel: "GRADE_12",
    section: "Mabini",
    topicCertifications: [
      { subject: "FILIPINO", topic: "Panitikang Pilipino", certified: true },
      { subject: "ARALING_PANLIPUNAN", topic: "Kasaysayan ng Pilipinas", certified: true },
      { subject: "FILIPINO", topic: "Pagsulat ng Sanaysay", certified: false },
    ],
  },
  {
    email: "paolo.garcia@katuwang.test",
    firstName: "Paolo",
    lastName: "Garcia",
    gradeLevel: "GRADE_9",
    section: "Aguinaldo",
    topicCertifications: [{ subject: "SCIENCE", topic: "Chemical Reactions & Matter", certified: true }],
  },
  {
    email: "liza.fernandez@katuwang.test",
    firstName: "Liza",
    lastName: "Fernandez",
    gradeLevel: "GRADE_11",
    section: "Luna",
    topicCertifications: [
      {
        subject: "MAPEH",
        topic: "Physical Education & Sports",
        certified: false,
        rejected: true,
        reviewNote: "Assessment incomplete — please resubmit with the practical component.",
      },
      {
        subject: "MAPEH",
        topic: "Health Education",
        certified: true,
      },
    ],
  },
  {
    // Stable demo account for walkthroughs/screenshots
    email: "demo@tutor.test",
    firstName: "Demo",
    lastName: "Tutor",
    gradeLevel: "GRADE_10",
    section: "Demo",
    topicCertifications: [
      { subject: "MATH", topic: "Algebraic Expressions", certified: true },
      { subject: "ENGLISH", topic: "Grammar & Sentence Structure", certified: true },
    ],
  },
];

const LEARNERS: LearnerSeed[] = [
  { email: "juan.delacruz@katuwang.test", firstName: "Juan", lastName: "Dela Cruz", gradeLevel: "GRADE_10", section: "Rizal" },
  { email: "carla.mendoza@katuwang.test", firstName: "Carla", lastName: "Mendoza", gradeLevel: "GRADE_9", section: "Bonifacio" },
  { email: "miguel.torres@katuwang.test", firstName: "Miguel", lastName: "Torres", gradeLevel: "GRADE_11", section: "Mabini" },
  { email: "angela.ramos@katuwang.test", firstName: "Angela", lastName: "Ramos", gradeLevel: "GRADE_12", section: "Aguinaldo" },
  { email: "kevin.bautista@katuwang.test", firstName: "Kevin", lastName: "Bautista", gradeLevel: "GRADE_8", section: "Luna" },
  { email: "sofia.villanueva@katuwang.test", firstName: "Sofia", lastName: "Villanueva", gradeLevel: "GRADE_10", section: "Rizal" },
  { email: "demo@learner.test", firstName: "Demo", lastName: "Learner", gradeLevel: "GRADE_10", section: "Demo" },
];

// Special moderation accounts for Admin features (Registration Approvals, Moderation Views)
const MODERATED_ACCOUNTS: { tutor?: TutorSeed; learner?: LearnerSeed }[] = [
  {
    learner: {
      email: "pending.learner@katuwang.test",
      firstName: "Emmanuel",
      lastName: "Ramos",
      gradeLevel: "GRADE_8",
      section: "Jacinto",
      status: "PENDING",
    },
  },
  {
    tutor: {
      email: "pending.tutor@katuwang.test",
      firstName: "Camille",
      lastName: "Navarro",
      gradeLevel: "GRADE_11",
      section: "Mabini",
      status: "PENDING",
      topicCertifications: [
        { subject: "SCIENCE", topic: "Cell Biology & Genetics", certified: false },
      ],
    },
  },
  {
    tutor: {
      email: "suspended.tutor@katuwang.test",
      firstName: "Rafael",
      lastName: "Castillo",
      gradeLevel: "GRADE_12",
      section: "Silang",
      status: "SUSPENDED",
      statusReason: "Under investigation for unnotified absences.",
      statusExpiresAt: inDays(7),
      statusUpdatedAt: new Date(),
      topicCertifications: [
        { subject: "MATH", topic: "Trigonometry", certified: true },
      ],
    },
  },
  {
    learner: {
      email: "banned.user@katuwang.test",
      firstName: "Carlos",
      lastName: "Aquino",
      gradeLevel: "GRADE_10",
      section: "Del Pilar",
      status: "BANNED",
      statusReason: "Repeated severe violations of community standards.",
      statusUpdatedAt: new Date(),
    },
  },
  {
    learner: {
      email: "declined.applicant@katuwang.test",
      firstName: "Andrea",
      lastName: "Ocampo",
      gradeLevel: "GRADE_9",
      section: "Rizal",
      status: "DECLINED",
      statusReason: "Incomplete student verification credentials provided.",
      statusUpdatedAt: new Date(),
    },
  },
];

// ─── User creation (idempotent — reuses existing accounts on re-run) ─────────

async function ensureUser(
  input: {
    email: string;
    firstName: string;
    lastName: string;
    gradeLevel: GradeLevel;
    section: string;
    status?: AccountStatus;
    statusReason?: string | null;
    statusExpiresAt?: Date | null;
    statusUpdatedAt?: Date | null;
  },
  role: Role,
  passwordHash: string
): Promise<{ user: User; isNew: boolean; wasUpdated: boolean }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    if (input.status && existing.status !== input.status) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          statusReason: input.statusReason ?? null,
          statusExpiresAt: input.statusExpiresAt ?? null,
          statusUpdatedAt: input.statusUpdatedAt ?? new Date(),
        },
      });
      return { user: updated, isNew: false, wasUpdated: true };
    }
    return { user: existing, isNew: false, wasUpdated: false };
  }

  const anonymousId = await nextAnonymousId(role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER");

  const created = await prisma.user.create({
    data: {
      anonymousId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: passwordHash,
      role,
      gradeLevel: input.gradeLevel,
      section: input.section,
      consentGiven: true,
      emailVerifiedAt: new Date(),
      status: input.status ?? "ACTIVE",
      statusReason: input.statusReason ?? null,
      statusExpiresAt: input.statusExpiresAt ?? null,
      statusUpdatedAt: input.statusUpdatedAt ?? (input.status ? new Date() : null),
    },
  });
  return { user: created, isNew: true, wasUpdated: false };
}

async function ensureTutorProfile(userId: string, topicCertifications: TutorSeed["topicCertifications"]) {
  const profile = await prisma.tutorProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  let certCount = 0;
  for (const tc of topicCertifications) {
    const status = tc.certified ? "CERTIFIED" : tc.rejected ? "REJECTED" : "PENDING";
    const certifiedAt = tc.certified ? new Date() : null;
    const reviewedAt = tc.certified || tc.rejected ? new Date() : null;
    const reviewNote = tc.rejected ? tc.reviewNote ?? null : null;
    await prisma.topicCertification.upsert({
      where: {
        tutorProfileId_subject_topic: { tutorProfileId: profile.id, subject: tc.subject, topic: tc.topic },
      },
      update: { status, certifiedAt, reviewedAt, reviewNote },
      create: {
        tutorProfileId: profile.id,
        subject: tc.subject,
        topic: tc.topic,
        status,
        certifiedAt,
        reviewedAt,
        reviewNote,
      },
    });
    if (tc.certified) certCount++;
  }

  return { profile, certCount };
}

// ─── Class definitions ───────────────────────────────────────────────────────

function inDays(days: number, hour = 15): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

interface SessionSeed {
  topic: string;
  scheduledAt: Date;
  duration: number;
  status: SessionStatus;
}

interface ClassSeed {
  code?: string;
  tutorEmail: string;
  subject: string;
  gradeLevel?: GradeLevel;
  topics: string[];
  description: string;
  maxStudents: number;
  meetingLink: string | null;
  status: ClassStatus;
  suspendedReason?: string | null;
  suspendedUntil?: Date | null;
  sessions: SessionSeed[];
  enrolledLearnerEmails: string[];
}

function buildClasses(): ClassSeed[] {
  return [
    {
      code: "C-0001",
      tutorEmail: "maria.santos@katuwang.test",
      subject: "MATH",
      gradeLevel: "GRADE_10",
      topics: ["Algebraic Expressions", "Linear Equations & Inequalities"],
      description: "Review of algebraic expressions and solving linear equations, with practice problems.",
      maxStudents: 2,
      meetingLink: "https://meet.google.com/math-review-1",
      status: "SCHEDULED",
      sessions: [
        { topic: "Algebraic Expressions", scheduledAt: inDays(2, 15), duration: 60, status: "SCHEDULED" },
        { topic: "Linear Equations & Inequalities", scheduledAt: inDays(4, 15), duration: 60, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test"],
    },
    {
      code: "C-0002",
      tutorEmail: "maria.santos@katuwang.test",
      subject: "MATH",
      topics: ["Geometry & Measurement"],
      description: "Intro session on area, perimeter, and volume problems for upcoming exams.",
      maxStudents: 1,
      meetingLink: null,
      status: "SCHEDULED",
      sessions: [{ topic: "Geometry & Measurement", scheduledAt: inDays(6, 15), duration: 90, status: "SCHEDULED" }],
      enrolledLearnerEmails: [],
    },
    {
      code: "C-0003",
      tutorEmail: "jose.reyes@katuwang.test",
      subject: "ENGLISH",
      topics: ["Essay & Paragraph Writing", "Reading Comprehension"],
      description: "Small group workshop on structuring a five-paragraph essay.",
      maxStudents: 3,
      meetingLink: "https://meet.google.com/essay-workshop",
      status: "SCHEDULED",
      sessions: [
        { topic: "Essay & Paragraph Writing", scheduledAt: inDays(3, 15), duration: 60, status: "SCHEDULED" },
        { topic: "Reading Comprehension", scheduledAt: inDays(5, 15), duration: 60, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: ["carla.mendoza@katuwang.test", "miguel.torres@katuwang.test"],
    },
    {
      code: "C-0004",
      tutorEmail: "jose.reyes@katuwang.test",
      subject: "ENGLISH",
      topics: ["Public Speaking & Oral Communication"],
      description: "1-on-1 coaching for an upcoming class declamation piece.",
      maxStudents: 1,
      meetingLink: "https://meet.google.com/declam-coaching",
      status: "SCHEDULED",
      sessions: [
        { topic: "Public Speaking & Oral Communication", scheduledAt: inDays(1, 10), duration: 45, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: ["angela.ramos@katuwang.test"],
    },
    {
      code: "C-0005",
      tutorEmail: "ana.cruz@katuwang.test",
      subject: "FILIPINO",
      topics: ["Panitikang Pilipino", "Pagsulat ng Sanaysay"],
      description: "Talakayan ng mga akda at gawaing pagsulat para sa quarterly exam.",
      maxStudents: 2,
      meetingLink: null,
      status: "SCHEDULED",
      sessions: [
        { topic: "Panitikang Pilipino", scheduledAt: inDays(4, 15), duration: 60, status: "SCHEDULED" },
        { topic: "Pagsulat ng Sanaysay", scheduledAt: inDays(6, 15), duration: 60, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: [],
    },
    {
      code: "C-0006",
      tutorEmail: "ana.cruz@katuwang.test",
      subject: "ARALING_PANLIPUNAN",
      topics: ["Kasaysayan ng Pilipinas"],
      description: "Group review ng mahahalagang pangyayari bago ang Rebolusyong Pilipino.",
      maxStudents: 4,
      meetingLink: "https://meet.google.com/kasaysayan-review",
      status: "SCHEDULED",
      sessions: [{ topic: "Kasaysayan ng Pilipinas", scheduledAt: inDays(8, 15), duration: 60, status: "SCHEDULED" }],
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test", "sofia.villanueva@katuwang.test"],
    },
    {
      code: "C-0007",
      tutorEmail: "paolo.garcia@katuwang.test",
      subject: "SCIENCE",
      gradeLevel: "GRADE_9",
      topics: ["Chemical Reactions & Matter", "Force, Motion & Energy"],
      description: "Lab-style walkthrough of common chemical reaction and motion problems.",
      maxStudents: 2,
      meetingLink: null,
      status: "SCHEDULED",
      sessions: [
        { topic: "Chemical Reactions & Matter", scheduledAt: inDays(7, 15), duration: 90, status: "SCHEDULED" },
        { topic: "Force, Motion & Energy", scheduledAt: inDays(9, 15), duration: 90, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: [],
    },
    {
      code: "C-0008",
      tutorEmail: "liza.fernandez@katuwang.test",
      subject: "MAPEH",
      topics: ["Physical Education & Sports"],
      description: "Group session covering PE performance task requirements.",
      maxStudents: 5,
      meetingLink: "https://meet.google.com/pe-performance-task",
      status: "SCHEDULED",
      sessions: [{ topic: "Physical Education & Sports", scheduledAt: inDays(2, 9), duration: 30, status: "SCHEDULED" }],
      enrolledLearnerEmails: ["kevin.bautista@katuwang.test"],
    },
    {
      code: "C-0009",
      tutorEmail: "maria.santos@katuwang.test",
      subject: "MATH",
      topics: ["Fractions & Decimals"],
      description: "Completed review session on converting fractions to decimals.",
      maxStudents: 2,
      meetingLink: null,
      status: "COMPLETED",
      sessions: [{ topic: "Fractions & Decimals", scheduledAt: inDays(-3), duration: 60, status: "COMPLETED" }],
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test"],
    },
    {
      code: "C-0010",
      tutorEmail: "jose.reyes@katuwang.test",
      subject: "ENGLISH",
      topics: ["Grammar & Sentence Structure"],
      description: "Completed grammar drills ahead of the periodic exam.",
      maxStudents: 2,
      meetingLink: null,
      status: "COMPLETED",
      sessions: [{ topic: "Grammar & Sentence Structure", scheduledAt: inDays(-5), duration: 60, status: "COMPLETED" }],
      enrolledLearnerEmails: ["carla.mendoza@katuwang.test"],
    },
    {
      code: "C-0011",
      tutorEmail: "ana.cruz@katuwang.test",
      subject: "FILIPINO",
      topics: ["Balarila (Gramatika)"],
      description: "Sesyong kinansela dahil sa hindi inaasahang salungatan sa iskedyul.",
      maxStudents: 2,
      meetingLink: null,
      status: "CANCELLED",
      sessions: [{ topic: "Balarila (Gramatika)", scheduledAt: inDays(10, 15), duration: 60, status: "CANCELLED" }],
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test"],
    },
    {
      code: "C-0012",
      tutorEmail: "demo@tutor.test",
      subject: "MATH",
      gradeLevel: "GRADE_10",
      topics: ["Algebraic Expressions", "Linear Equations & Inequalities"],
      description: "Demo class for walkthroughs — a multi-session course with an enrolled roster.",
      maxStudents: 3,
      meetingLink: "https://meet.google.com/demo-math",
      status: "SCHEDULED",
      sessions: [
        { topic: "Algebraic Expressions", scheduledAt: inDays(2, 15), duration: 60, status: "SCHEDULED" },
        { topic: "Linear Equations & Inequalities", scheduledAt: inDays(4, 15), duration: 60, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: ["demo@learner.test", "juan.delacruz@katuwang.test"],
    },
    {
      code: "C-0013",
      tutorEmail: "demo@tutor.test",
      subject: "ENGLISH",
      topics: ["Grammar & Sentence Structure"],
      description: "Demo class showing a second subject and a different enrolled student.",
      maxStudents: 2,
      meetingLink: null,
      status: "SCHEDULED",
      sessions: [
        { topic: "Grammar & Sentence Structure", scheduledAt: inDays(3, 10), duration: 45, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: ["carla.mendoza@katuwang.test"],
    },
    {
      code: "C-0016",
      tutorEmail: "liza.fernandez@katuwang.test",
      subject: "MAPEH",
      topics: ["Health Education"],
      description: "Health education workshop — currently under moderation review.",
      maxStudents: 5,
      meetingLink: "https://meet.google.com/health-workshop",
      status: "SUSPENDED",
      suspendedReason: "Report filed regarding session content; pending review.",
      suspendedUntil: inDays(7),
      sessions: [
        { topic: "Health Education", scheduledAt: inDays(3, 14), duration: 60, status: "SCHEDULED" },
      ],
      enrolledLearnerEmails: ["kevin.bautista@katuwang.test"],
    },
  ];
}

interface EnsureTutorClassInput {
  tutorProfileId: string;
  preferredCode?: string;
  subject: string;
  gradeLevel?: GradeLevel | null;
  description: string;
  maxStudents: number;
  meetingLink?: string | null;
  status: ClassStatus;
  suspendedReason?: string | null;
  suspendedUntil?: Date | null;
  published?: boolean;
  topics: string[];
  sessions: {
    topic: string;
    scheduledAt: Date;
    duration: number;
    status?: SessionStatus;
  }[];
  enrolledLearnerIds: string[];
}

async function ensureTutorClass(input: EnsureTutorClassInput): Promise<{
  id: string;
  code: string;
  subject: string;
  status: ClassStatus;
  tutorProfileId: string;
  isNew: boolean;
}> {
  let existing = input.preferredCode
    ? await prisma.tutorClass.findUnique({
        where: { code: input.preferredCode },
        include: { topics: true, sessions: true, enrollments: true },
      })
    : null;

  if (!existing) {
    existing = await prisma.tutorClass.findFirst({
      where: {
        tutorProfileId: input.tutorProfileId,
        subject: input.subject,
        description: input.description,
      },
      include: { topics: true, sessions: true, enrollments: true },
    });
  }

  if (existing) {
    await prisma.tutorClass.update({
      where: { id: existing.id },
      data: {
        tutorProfileId: input.tutorProfileId,
        gradeLevel: input.gradeLevel ?? null,
        description: input.description,
        maxStudents: input.maxStudents,
        meetingLink: input.meetingLink ?? null,
        status: input.status,
        suspendedReason: input.suspendedReason ?? null,
        suspendedUntil: input.suspendedUntil ?? null,
        published: input.published ?? true,
      },
    });

    for (const topic of input.topics) {
      if (!existing.topics.some((t) => t.topic === topic)) {
        await prisma.classTopic.create({
          data: { classId: existing.id, topic },
        });
      }
    }

    for (const s of input.sessions) {
      const match = existing.sessions.find((ex) => ex.topic === s.topic);
      if (match) {
        await prisma.classSession.update({
          where: { id: match.id },
          data: {
            scheduledAt: s.scheduledAt,
            duration: s.duration,
            status: s.status ?? "SCHEDULED",
          },
        });
      } else {
        await prisma.classSession.create({
          data: {
            classId: existing.id,
            topic: s.topic,
            scheduledAt: s.scheduledAt,
            duration: s.duration,
            status: s.status ?? "SCHEDULED",
          },
        });
      }
    }

    for (const learnerId of input.enrolledLearnerIds) {
      if (!existing.enrollments.some((e) => e.learnerId === learnerId)) {
        await prisma.classEnrollment.create({
          data: { classId: existing.id, learnerId },
        });
      }
    }

    recordCodeNumber(existing.code);

    return {
      id: existing.id,
      code: existing.code,
      subject: existing.subject,
      status: input.status,
      tutorProfileId: input.tutorProfileId,
      isNew: false,
    };
  }

  const code = await allocateClassCode(input.preferredCode);

  const created = await prisma.tutorClass.create({
    data: {
      tutorProfileId: input.tutorProfileId,
      code,
      subject: input.subject,
      gradeLevel: input.gradeLevel ?? null,
      description: input.description,
      maxStudents: input.maxStudents,
      meetingLink: input.meetingLink ?? null,
      published: input.published ?? true,
      status: input.status,
      suspendedReason: input.suspendedReason ?? null,
      suspendedUntil: input.suspendedUntil ?? null,
      topics: { create: input.topics.map((topic) => ({ topic })) },
      sessions: {
        create: input.sessions.map((s) => ({
          topic: s.topic,
          scheduledAt: s.scheduledAt,
          duration: s.duration,
          status: s.status ?? "SCHEDULED",
        })),
      },
      enrollments: {
        create: input.enrolledLearnerIds.map((learnerId) => ({ learnerId })),
      },
    },
    select: { id: true, code: true, subject: true, status: true, tutorProfileId: true },
  });

  recordCodeNumber(code);

  return { ...created, isNew: true };
}

async function ensureTopicRequest(input: {
  learnerId: string;
  subject: string;
  gradeLevel: GradeLevel;
  note: string | null;
  status: TopicRequestStatus;
  fulfilledClassId?: string | null;
  directedTutorProfileId?: string | null;
  topics: string[];
  slots?: { day: string; startTime: string; endTime: string }[];
}) {
  const existing = await prisma.topicRequest.findFirst({
    where: {
      learnerId: input.learnerId,
      subject: input.subject,
      note: input.note,
      topics: { some: { topic: input.topics[0] } },
    },
    include: { topics: true, slots: true },
  });

  if (existing) {
    await prisma.$transaction(async (tx) => {
      const before = await requestSnapshot(tx, existing.id);
      const now = new Date();
      await tx.topicRequest.update({
        where: { id: existing.id },
        data: {
          gradeLevel: input.gradeLevel,
          status: input.status,
          fulfilledClassId: input.fulfilledClassId ?? null,
          directedTutorProfileId: input.directedTutorProfileId ?? null,
          ...(input.status === "OPEN" && before.status !== "OPEN"
            ? { lastSubmittedAt: now, expiresAt: requestDeadline(now) }
            : {}),
        },
      });

      for (const topic of input.topics) {
        if (!existing.topics.some((t) => t.topic === topic)) {
          await tx.topicRequestTopic.create({
            data: { requestId: existing.id, topic },
          });
        }
      }

      if (input.slots) {
        for (const slot of input.slots) {
          if (!existing.slots.some((s) => s.day === slot.day && s.startTime === slot.startTime && s.endTime === slot.endTime)) {
            await tx.topicRequestSlot.create({
              data: { requestId: existing.id, day: slot.day, startTime: slot.startTime, endTime: slot.endTime },
            });
          }
        }
      }

      const after = await requestSnapshot(tx, existing.id);
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        await recordRequestHistory(tx, existing.id, null, "SEED_UPDATED", before);
      }
    });
    return { request: existing, isNew: false };
  }

  const created = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const request = await tx.topicRequest.create({
      data: {
        learnerId: input.learnerId,
        lastSubmittedAt: now,
        expiresAt: requestDeadline(now),
        subject: input.subject,
        gradeLevel: input.gradeLevel,
        note: input.note,
        status: input.status,
        fulfilledClassId: input.fulfilledClassId ?? null,
        directedTutorProfileId: input.directedTutorProfileId ?? null,
        topics: { create: input.topics.map((topic) => ({ topic })) },
        slots: input.slots ? { create: input.slots } : undefined,
      },
    });
    await recordRequestHistory(tx, request.id, null, "CREATED", null);
    return request;
  });
  return { request: created, isNew: true };
}

async function ensureNotification(input: {
  userId: string;
  type: string;
  message: string;
  link?: string | null;
  readAt?: Date | null;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      type: input.type,
      link: input.link ?? null,
    },
  });
  if (existing) return { notification: existing, isNew: false };

  const created = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      link: input.link ?? null,
      readAt: input.readAt ?? null,
    },
  });
  return { notification: created, isNew: true };
}

// ─── Moderation & Audit Helpers ─────────────────────────────────────────────

async function ensureAuditLog(input: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
  createdAt?: Date;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
    },
  });
  if (existing) return { log: existing, isNew: false };

  const created = await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason ?? null,
      createdAt: input.createdAt ?? new Date(),
    },
  });
  return { log: created, isNew: true };
}

async function ensureClassAppeal(input: {
  classId: string;
  tutorProfileId: string;
  reason: string;
  status: ClassAppealStatus;
  reviewNote?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
}) {
  const existing = await prisma.classAppeal.findFirst({
    where: {
      classId: input.classId,
      tutorProfileId: input.tutorProfileId,
    },
  });
  if (existing) return { appeal: existing, isNew: false };

  const created = await prisma.classAppeal.create({
    data: {
      classId: input.classId,
      tutorProfileId: input.tutorProfileId,
      reason: input.reason,
      status: input.status,
      reviewNote: input.reviewNote ?? null,
      reviewedById: input.reviewedById ?? null,
      reviewedAt: input.reviewedAt ?? null,
    },
  });
  return { appeal: created, isNew: true };
}

async function ensureReport(input: {
  reporterId: string;
  targetType: ReportTargetType;
  reportedTutorProfileId?: string | null;
  classId?: string | null;
  details?: string | null;
  status: ReportStatus;
  resolutionNote?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  violations: ReportViolationType[];
}) {
  const existing = await prisma.report.findFirst({
    where: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      reportedTutorProfileId: input.reportedTutorProfileId ?? undefined,
      classId: input.classId ?? undefined,
    },
  });
  if (existing) return { report: existing, isNew: false };

  const created = await prisma.report.create({
    data: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      reportedTutorProfileId: input.reportedTutorProfileId ?? null,
      classId: input.classId ?? null,
      details: input.details ?? null,
      status: input.status,
      resolutionNote: input.resolutionNote ?? null,
      reviewedById: input.reviewedById ?? null,
      reviewedAt: input.reviewedAt ?? null,
      violations: {
        create: input.violations.map((type) => ({ type })),
      },
    },
  });
  return { report: created, isNew: true };
}

async function ensureClassRecommendation(input: {
  classId: string;
  learnerId: string;
  adminId: string;
  note?: string | null;
}) {
  const existing = await prisma.classRecommendation.findUnique({
    where: {
      classId_learnerId: { classId: input.classId, learnerId: input.learnerId },
    },
  });
  if (existing) return { rec: existing, isNew: false };

  const created = await prisma.classRecommendation.create({
    data: {
      classId: input.classId,
      learnerId: input.learnerId,
      adminId: input.adminId,
      note: input.note ?? null,
    },
  });
  return { rec: created, isNew: true };
}

async function ensureChatbotMiss(input: {
  message: string;
  role: Role;
  userId?: string | null;
}) {
  const existing = await prisma.chatbotMiss.findFirst({
    where: {
      message: input.message,
      role: input.role,
    },
  });
  if (existing) return { miss: existing, isNew: false };

  const created = await prisma.chatbotMiss.create({
    data: {
      message: input.message,
      role: input.role,
      userId: input.userId ?? null,
    },
  });
  return { miss: created, isNew: true };
}

async function ensureTutorAssessmentAttempt(
  tutorProfileId: string,
  subject: string,
  topic: string
) {
  const existing = await prisma.assessmentAttempt.findFirst({
    where: { tutorProfileId, subject, topic, status: "PASSED" },
  });
  if (existing) return { attempt: existing, isNew: false };

  const bankQs = await prisma.assessmentQuestion.findMany({
    where: { origin: "BANK", subject, topic, active: true },
    take: 5,
    include: { options: true },
  });
  if (bankQs.length === 0) return null;

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      tutorProfileId,
      subject,
      topic,
      attemptNo: 1,
      status: "PASSED",
      questionCount: bankQs.length,
      correctCount: bankQs.length,
      scorePercent: 100,
      passPercent: 60,
      startedAt: inDays(-10),
      submittedAt: inDays(-10),
      items: {
        create: bankQs.map((q, idx) => {
          const correctOpt = q.options.find((o) => o.isCorrect) ?? q.options[0];
          return {
            questionId: q.id,
            position: idx,
            selectedOptionId: correctOpt.id,
            isCorrect: true,
          };
        }),
      },
    },
  });
  return { attempt, isNew: true };
}

// ─── Procedural generation seeds ────────────────────────────────────────────

function genTutorSeeds(count: number): TutorSeed[] {
  const seeds: TutorSeed[] = [];
  for (let idx = 0; idx < count; idx++) {
    const certSubject = rand.pick(ALL_SUBJECTS);
    const certTopics = rand.sample(SUBJECT_TOPICS[certSubject], rand.int(1, 3));
    const certs = certTopics.map((topic, i) => ({
      subject: certSubject,
      topic,
      certified: i === 0 || rand.chance(0.6),
    }));

    seeds.push({
      email: `gen.tutor.${pad(idx + 1)}@seed.katuwang.test`,
      firstName: rand.pick(FIRST_NAMES),
      lastName: rand.pick(LAST_NAMES),
      gradeLevel: rand.pick(ALL_GRADES),
      section: rand.pick(SECTIONS),
      topicCertifications: certs,
    });
  }
  return seeds;
}

function genLearnerSeeds(count: number): LearnerSeed[] {
  return Array.from({ length: count }, (_, idx) => ({
    email: `gen.learner.${pad(idx + 1)}@seed.katuwang.test`,
    firstName: rand.pick(FIRST_NAMES),
    lastName: rand.pick(LAST_NAMES),
    gradeLevel: rand.pick(ALL_GRADES),
    section: rand.pick(SECTIONS),
  }));
}

interface GeneratedClass {
  id: string;
  code: string;
  subject: string;
  status: ClassStatus;
  tutorProfileId: string;
  isNew: boolean;
}

async function createGeneratedClass(
  index: number,
  profileId: string,
  certifiedTopics: { subject: string; topic: string }[],
  learnerIds: string[]
): Promise<GeneratedClass> {
  let subject: string;
  let topics: string[];
  if (certifiedTopics.length > 0 && rand.chance(0.65)) {
    subject = rand.pick(certifiedTopics).subject;
    const inSubject = certifiedTopics.filter((c) => c.subject === subject).map((c) => c.topic);
    const extra = rand.sample(
      SUBJECT_TOPICS[subject].filter((t) => !inSubject.includes(t)),
      rand.int(0, 2)
    );
    topics = [...new Set([...inSubject, ...extra])].slice(0, 4);
  } else {
    subject = rand.pick(ALL_SUBJECTS);
    topics = rand.sample(SUBJECT_TOPICS[subject], rand.int(1, 3));
  }

  const roll = rng();
  const status: ClassStatus = roll < 0.8 ? "SCHEDULED" : roll < 0.92 ? "COMPLETED" : "CANCELLED";
  const maxStudents = rand.int(1, 6);

  const sessionCount = rand.int(1, 3);
  const sessions = Array.from({ length: sessionCount }, () => {
    const topic = rand.pick(topics);
    const hour = rand.pick([9, 10, 13, 15, 16]);
    if (status === "COMPLETED") {
      return { topic, scheduledAt: inDays(-rand.int(2, 40), hour), duration: rand.pick([30, 45, 60, 90]), status: "COMPLETED" as SessionStatus };
    }
    if (status === "CANCELLED") {
      return { topic, scheduledAt: inDays(rand.int(2, 21), hour), duration: rand.pick([30, 45, 60, 90]), status: "CANCELLED" as SessionStatus };
    }
    return { topic, scheduledAt: inDays(rand.int(1, 28), hour), duration: rand.pick([30, 45, 60, 90]), status: "SCHEDULED" as SessionStatus };
  });

  const enrolledIds = rand.sample(learnerIds, rand.int(0, maxStudents));
  const preferredCode = `C-${pad(17 + index, 4)}`;

  const created = await ensureTutorClass({
    tutorProfileId: profileId,
    preferredCode,
    subject,
    gradeLevel: rand.chance(0.5) ? rand.pick(ALL_GRADES) : null,
    description: `${subject} session on ${topics.join(", ")}.`,
    maxStudents,
    meetingLink: rand.chance(0.5) ? `https://meet.google.com/seed-${Math.floor(rng() * 1e6)}` : null,
    published: rand.chance(0.85),
    status,
    topics,
    sessions,
    enrolledLearnerIds: enrolledIds,
  });
  return created;
}

// ─── Assessment question bank ───────────────────────────────────────────────

interface QSeed {
  prompt: string;
  explanation?: string;
  options: [string, boolean][];
}

const QUESTION_BANK: { subject: string; topic: string; questions: QSeed[] }[] = [
  {
    subject: "MATH",
    topic: "Algebraic Expressions",
    questions: [
      {
        prompt: "Simplify: 3x + 5x - 2x",
        explanation: "Combine like terms: (3 + 5 - 2)x = 6x.",
        options: [["6x", true], ["10x", false], ["x", false], ["8x", false]],
      },
      {
        prompt: "What is the coefficient of y in the expression 7 - 4y?",
        options: [["-4", true], ["4", false], ["7", false], ["-7", false]],
      },
      {
        prompt: "Evaluate 2a + 3 when a = 4.",
        options: [["11", true], ["9", false], ["14", false], ["24", false]],
      },
      {
        prompt: "Which of these is a like term to 5xy?",
        options: [["-2xy", true], ["5x", false], ["5y", false], ["xy^2", false]],
      },
      {
        prompt: "Expand: 2(x + 3)",
        explanation: "Distribute the 2 across both terms: 2x + 6.",
        options: [["2x + 6", true], ["2x + 3", false], ["x + 6", false], ["2x + 5", false]],
      },
      {
        prompt: "Simplify: (4a + 2) + (3a - 5)",
        options: [["7a - 3", true], ["7a + 3", false], ["7a - 7", false], ["a - 3", false]],
      },
    ],
  },
  {
    subject: "ENGLISH",
    topic: "Grammar & Sentence Structure",
    questions: [
      {
        prompt: "Choose the correct sentence.",
        options: [
          ["She doesn't like coffee.", true],
          ["She don't likes coffee.", false],
          ["She not like coffee.", false],
          ["She doesn't likes coffee.", false],
        ],
      },
      {
        prompt: "Identify the subject: \"The tired students finished the exam.\"",
        options: [["students", true], ["exam", false], ["finished", false], ["tired", false]],
      },
      {
        prompt: "Which word is a conjunction?",
        options: [["because", true], ["quickly", false], ["happiness", false], ["under", false]],
      },
      {
        prompt: "Pick the sentence with correct subject-verb agreement.",
        options: [
          ["The list of items is on the desk.", true],
          ["The list of items are on the desk.", false],
          ["The list of items were on the desk.", false],
          ["The list of items been on the desk.", false],
        ],
      },
      {
        prompt: "What type of sentence is: \"Close the door.\"",
        explanation: "It gives a command, so it is imperative.",
        options: [["Imperative", true], ["Declarative", false], ["Interrogative", false], ["Exclamatory", false]],
      },
      {
        prompt: "Choose the correctly punctuated sentence.",
        options: [
          ["My brother, who is a doctor, lives in Cebu.", true],
          ["My brother who is a doctor lives in Cebu.", false],
          ["My brother, who is a doctor lives in Cebu.", false],
          ["My brother who is a doctor, lives in Cebu.", false],
        ],
      },
    ],
  },
];

const GEN_STEMS: ((t: string, s: string) => string)[] = [
  (t, s) => `Which approach best supports mastery of "${t}" in ${s}?`,
  (t) => `A learner working on "${t}" should mainly focus on:`,
  (t) => `What is the most effective habit when studying "${t}"?`,
  (t, s) => `In ${s}, real progress on "${t}" is shown by being able to:`,
  (t) => `Which statement about practising "${t}" is the most accurate?`,
];
const GEN_CORRECT = [
  "Apply the underlying idea to a new, unfamiliar example.",
  "Break a hard problem into smaller, familiar steps.",
  "Check each result against the definition or rule.",
  "Work through examples first, then solve without help.",
  "Explain the reasoning out loud in your own words.",
];
const GEN_WRONG = [
  "Memorise an answer key without understanding it.",
  "Skip every practice exercise.",
  "Guess quickly and move on.",
  "Ignore feedback from a tutor.",
  "Assume every problem is solved the exact same way.",
  "Rely only on the first idea that comes to mind.",
];

function genQuestionsForTopic(subject: string, topic: string, n: number): QSeed[] {
  const out: QSeed[] = [];
  for (let i = 0; i < n; i++) {
    const stem = GEN_STEMS[i % GEN_STEMS.length];
    const correct: [string, boolean] = [GEN_CORRECT[rand.int(0, GEN_CORRECT.length - 1)], true];
    const wrongs: [string, boolean][] = rand.sample(GEN_WRONG, 3).map((w) => [w, false]);
    out.push({
      prompt: `${stem(topic, subject)} (practice item ${i + 1})`,
      explanation: "Placeholder practice question generated for the demo question bank.",
      options: rand.sample([correct, ...wrongs], 4),
    });
  }
  return out;
}

async function seedQuestionBank(adminId: string, demoTutorProfileId: string | null): Promise<number> {
  const perTopic = GEN.questionsPerTopic;
  const curated = new Map(QUESTION_BANK.map((s) => [`${s.subject}::${s.topic}`, s.questions]));
  let created = 0;

  // Single bulk prefetch to avoid hundreds of sequential network round-trips over remote database connections
  const existingQuestions = await prisma.assessmentQuestion.findMany({
    where: { origin: "BANK" },
    select: { subject: true, topic: true, prompt: true },
  });
  const existingSet = new Set(
    existingQuestions.map((q) => `${q.subject}::${q.topic}::${q.prompt}`)
  );

  let topicCounter = 0;
  const totalTopics = Object.keys(SUBJECT_TOPICS).reduce((acc, s) => acc + SUBJECT_TOPICS[s].length, 0);

  for (const subject of Object.keys(SUBJECT_TOPICS) as string[]) {
    for (const topic of SUBJECT_TOPICS[subject]) {
      topicCounter++;
      const hand = curated.get(`${subject}::${topic}`) ?? [];
      if (hand.length === 0 && perTopic === 0) continue;

      const questions = [
        ...hand,
        ...genQuestionsForTopic(subject, topic, Math.max(0, perTopic - hand.length)),
      ];

      let addedForTopic = 0;
      for (const q of questions) {
        const key = `${subject}::${topic}::${q.prompt}`;
        if (!existingSet.has(key)) {
          await prisma.assessmentQuestion.create({
            data: {
              subject,
              topic,
              prompt: q.prompt,
              explanation: q.explanation ?? null,
              createdById: adminId,
              options: {
                create: q.options.map(([text, isCorrect], position) => ({ text, isCorrect, position })),
              },
            },
          });
          existingSet.add(key);
          created++;
          addedForTopic++;
        }
      }

      if (addedForTopic > 0) {
        log.add("QuestionBank", `[${String(topicCounter).padStart(2, "0")}/${totalTopics}] ${subject} / ${topic}: +${addedForTopic} new questions created (${questions.length} total)`);
      } else {
        log.exist("QuestionBank", `[${String(topicCounter).padStart(2, "0")}/${totalTopics}] ${subject} / ${topic}: ${questions.length} questions verified in bank`);
      }
    }
  }

  for (const [key, value] of [
    ["assessmentQuestionCount", "5"],
    ["assessmentPassPercent", "60"],
    ["assessmentMinBankSize", "5"],
  ] as const) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    log.info("PlatformSetting", `${key} = ${value}`);
  }

  if (demoTutorProfileId) {
    await prisma.questionRequest.upsert({
      where: {
        tutorProfileId_subject_topic: {
          tutorProfileId: demoTutorProfileId,
          subject: "MATH",
          topic: "Trigonometry",
        },
      },
      update: { status: "OPEN", note: "Please add more Trigonometry questions.", resolvedById: null, resolvedAt: null },
      create: {
        tutorProfileId: demoTutorProfileId,
        subject: "MATH",
        topic: "Trigonometry",
        note: "Please add more Trigonometry questions.",
      },
    });
    log.add("QuestionRequest", "Tutor request open: MATH / Trigonometry");
  }

  return created;
}

// ─── Session pre/post-tests (demo) ──────────────────────────────────────────

async function seedSessionTests(): Promise<boolean> {
  const tutorClass = await prisma.tutorClass.findFirst({
    where: {
      subject: "MATH",
      tutorProfile: { user: { email: "demo@tutor.test" } },
      topics: { some: { topic: "Algebraic Expressions" } },
    },
    include: {
      enrollments: { select: { learnerId: true, learner: { select: { email: true } } }, orderBy: { enrolledAt: "asc" } },
      tutorProfile: { select: { id: true, user: { select: { id: true } } } },
      sessions: { where: { topic: "Algebraic Expressions" }, take: 1 },
    },
  });
  if (!tutorClass || tutorClass.enrollments.length === 0 || tutorClass.sessions.length === 0) return false;

  const classSession = tutorClass.sessions[0];
  await prisma.classSession.update({ where: { id: classSession.id }, data: { status: "COMPLETED" } });

  const existingTest = await prisma.sessionTest.findUnique({
    where: { sessionId: classSession.id },
  });
  if (existingTest) {
    log.exist("SessionTest", `Pre/Post Test already configured for session "${classSession.topic}"`);
    return true;
  }

  const bankQs = await prisma.assessmentQuestion.findMany({
    where: { origin: "BANK", subject: "MATH", topic: "Algebraic Expressions", active: true },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: { id: true, options: { select: { id: true, isCorrect: true }, orderBy: { position: "asc" } } },
  });
  if (bankQs.length < 5) return false;

  let custom = await prisma.assessmentQuestion.findFirst({
    where: {
      subject: "MATH",
      topic: "Algebraic Expressions",
      prompt: "What is the degree of the polynomial 4x^3 + x + 7?",
      origin: "TUTOR",
    },
    select: { id: true, options: { select: { id: true, isCorrect: true } } },
  });

  if (!custom) {
    custom = await prisma.assessmentQuestion.create({
      data: {
        subject: "MATH",
        topic: "Algebraic Expressions",
        prompt: "What is the degree of the polynomial 4x^3 + x + 7?",
        explanation: "The degree is the highest exponent, which is 3.",
        origin: "TUTOR",
        createdById: tutorClass.tutorProfile.user.id,
        ownerTutorProfileId: tutorClass.tutorProfile.id,
        options: {
          create: [
            { text: "3", isCorrect: true, position: 0 },
            { text: "1", isCorrect: false, position: 1 },
            { text: "4", isCorrect: false, position: 2 },
            { text: "7", isCorrect: false, position: 3 },
          ],
        },
      },
      select: { id: true, options: { select: { id: true, isCorrect: true } } },
    });
    log.add("CustomQuestion", "Tutor custom question added for Algebraic Expressions");
  }

  const specs = [...bankQs, custom];
  const test = await prisma.sessionTest.create({
    data: {
      sessionId: classSession.id,
      title: "Algebraic Expressions check-in",
      instructions: "A short diagnostic before and after this session. Answer as best you can.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      questions: { create: specs.map((q, i) => ({ questionId: q.id, position: i })) },
    },
  });

  type QSpec = { id: string; options: { id: string; isCorrect: boolean }[] };
  const makeAttempt = async (kind: "PRE" | "POST", learnerId: string, correctFraction: number) => {
    const correctUpTo = Math.round(specs.length * correctFraction);
    const items = specs.map((q: QSpec, idx) => {
      const right = idx < correctUpTo;
      const correctOpt = q.options.find((o) => o.isCorrect)!;
      const wrongOpt = q.options.find((o) => !o.isCorrect) ?? correctOpt;
      const chosen = right ? correctOpt : wrongOpt;
      return { questionId: q.id, position: idx, selectedOptionId: chosen.id, isCorrect: right };
    });
    const correctCount = items.filter((i) => i.isCorrect).length;
    await prisma.sessionTestAttempt.create({
      data: {
        sessionTestId: test.id,
        learnerId,
        kind,
        status: "SUBMITTED",
        totalQuestions: items.length,
        correctCount,
        scorePercent: Math.round((correctCount / items.length) * 100),
        submittedAt: new Date(),
        items: { create: items },
      },
    });
  };

  const demoLearner = tutorClass.enrollments.find((e) => e.learner.email === "demo@learner.test");
  const otherLearner = tutorClass.enrollments.find((e) => e.learner.email !== "demo@learner.test");

  if (demoLearner) {
    await makeAttempt("PRE", demoLearner.learnerId, 0.4);
    await makeAttempt("POST", demoLearner.learnerId, 0.85);
  }
  if (otherLearner) {
    await makeAttempt("PRE", otherLearner.learnerId, 0.3);
    await makeAttempt("POST", otherLearner.learnerId, 0.6);
  }

  log.add("SessionTest", `Pre/Post Test created for session "${classSession.topic}" with ${specs.length} questions and attempt submissions`);
  return true;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\x1b[1m\x1b[35m=======================================================\x1b[0m");
  console.log("\x1b[1m\x1b[35m  Katuwang Database Seeder — Real-time Population     \x1b[0m");
  console.log("\x1b[1m\x1b[35m=======================================================\x1b[0m");

  log.header("[1/12] Initializing Counters & Subject Catalog");
  await prisma.idCounter.upsert({
    where: { role: "TUTOR" },
    update: {},
    create: { role: "TUTOR", count: 0 },
  });

  await prisma.idCounter.upsert({
    where: { role: "LEARNER" },
    update: {},
    create: { role: "LEARNER", count: 0 },
  });

  await prisma.idCounter.upsert({
    where: { role: "CLASS" },
    update: {},
    create: { role: "CLASS", count: 0 },
  });
  await initMaxClassCode();
  log.info("IdCounter", `Synchronized counters (CLASS base code: ${maxObservedCodeNum})`);

  await seedSubjectCatalog(prisma);

  const passwordHash = await bcrypt.hash(DUMMY_PASSWORD, 12);

  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: "superadmin@katuwang.test" } });
  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@katuwang.test" },
    update: { role: "SUPER_ADMIN", anonymousId: "ADM-0001" },
    create: {
      anonymousId: "ADM-0001",
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@katuwang.test",
      password: passwordHash,
      role: "SUPER_ADMIN",
      gradeLevel: "GRADE_12",
      section: "ADMIN",
      consentGiven: true,
      emailVerifiedAt: new Date(),
    },
  });
  if (!existingSuperAdmin) {
    log.add("Super Admin", `${superAdminUser.email} [${superAdminUser.anonymousId}]`);
  } else {
    log.exist("Super Admin", `${superAdminUser.email} [${superAdminUser.anonymousId}]`);
  }

  await prisma.idCounter.upsert({
    where: { role: "ADMIN" },
    create: { role: "ADMIN", count: 1 },
    update: { count: 1 },
  });

  log.header("[3/12] Tutor Accounts & Topic Certifications");
  const tutorUsers: Record<string, User> = {};
  const tutorProfiles: Record<string, TutorProfile> = {};
  const certifiedByProfile = new Map<string, { subject: string; topic: string }[]>();

  const registerTutor = async (t: TutorSeed) => {
    const { user, isNew, wasUpdated } = await ensureUser(t, "STUDENT_TUTOR", passwordHash);
    const { profile, certCount } = await ensureTutorProfile(user.id, t.topicCertifications);
    tutorUsers[t.email] = user;
    tutorProfiles[t.email] = profile;
    certifiedByProfile.set(
      profile.id,
      t.topicCertifications.filter((c) => c.certified).map((c) => ({ subject: c.subject, topic: c.topic }))
    );

    const statusBadge = user.status !== "ACTIVE" ? ` [${user.status}]` : "";
    if (isNew) {
      log.add("Tutor", `${user.firstName} ${user.lastName} <${user.email}> [${user.anonymousId}]${statusBadge} (${certCount} certs)`);
    } else if (wasUpdated) {
      log.update("Tutor", `${user.firstName} ${user.lastName} <${user.email}> [${user.anonymousId}]${statusBadge}`);
    } else {
      log.exist("Tutor", `${user.firstName} ${user.lastName} <${user.email}> [${user.anonymousId}]${statusBadge}`);
    }
  };

  for (const t of TUTORS) await registerTutor(t);
  const generatedTutorSeeds = genTutorSeeds(GEN.tutors);
  for (const t of generatedTutorSeeds) await registerTutor(t);

  log.header("[4/12] Learner Accounts");
  const learnerUsers: Record<string, User> = {};
  const registerLearner = async (l: LearnerSeed) => {
    const { user, isNew, wasUpdated } = await ensureUser(l, "STUDENT_LEARNER", passwordHash);
    learnerUsers[l.email] = user;

    const statusBadge = user.status !== "ACTIVE" ? ` [${user.status}]` : "";
    if (isNew) {
      log.add("Learner", `${user.firstName} ${user.lastName} <${user.email}> [${user.anonymousId}]${statusBadge} (${user.gradeLevel}, Sec. ${user.section})`);
    } else if (wasUpdated) {
      log.update("Learner", `${user.firstName} ${user.lastName} <${user.email}> [${user.anonymousId}]${statusBadge}`);
    } else {
      log.exist("Learner", `${user.firstName} ${user.lastName} <${user.email}> [${user.anonymousId}]${statusBadge}`);
    }
  };

  for (const l of LEARNERS) await registerLearner(l);
  const generatedLearnerSeeds = genLearnerSeeds(GEN.learners);
  for (const l of generatedLearnerSeeds) await registerLearner(l);

  // Special Moderated Accounts (Pending, Suspended, Banned, Declined)
  for (const mod of MODERATED_ACCOUNTS) {
    if (mod.tutor) {
      await registerTutor(mod.tutor);
    }
    if (mod.learner) {
      await registerLearner(mod.learner);
    }
  }

  log.header("[5/12] Classes, Sessions & Enrollments");
  const allProfileIds = Object.values(tutorProfiles).map((p) => p.id);
  const allLearnerIds = Object.values(learnerUsers).map((u) => u.id);

  const classesList: { id: string; code: string; subject: string; status: ClassStatus; tutorProfileId: string }[] = [];
  for (const c of buildClasses()) {
    const tutorProfile = tutorProfiles[c.tutorEmail];
    if (!tutorProfile) continue;
    const enrolledIds = c.enrolledLearnerEmails.map((email) => learnerUsers[email]?.id).filter(Boolean);
    const createdClass = await ensureTutorClass({
      tutorProfileId: tutorProfile.id,
      preferredCode: c.code,
      subject: c.subject,
      gradeLevel: c.gradeLevel ?? null,
      description: c.description,
      maxStudents: c.maxStudents,
      meetingLink: c.meetingLink,
      status: c.status,
      suspendedReason: c.suspendedReason,
      suspendedUntil: c.suspendedUntil,
      topics: c.topics,
      sessions: c.sessions,
      enrolledLearnerIds: enrolledIds,
    });
    classesList.push(createdClass);
    if (createdClass.isNew) {
      log.add("Class", `${createdClass.code}: ${c.subject} (${c.topics.join(", ")}) [${c.status}] | ${enrolledIds.length} enrolled`);
    } else {
      log.exist("Class", `${createdClass.code}: ${c.subject} (${c.topics.join(", ")}) [${c.status}] verified`);
    }
  }

  // Ensure procedurally generated classes
  if (GEN.classes > 0) {
    const profilePool = allProfileIds;
    for (let i = 0; i < GEN.classes; i++) {
      const profileId = rand.pick(profilePool);
      const generated = await createGeneratedClass(i, profileId, certifiedByProfile.get(profileId) ?? [], allLearnerIds);
      classesList.push(generated);
      if (generated.isNew) {
        log.add("Class (Gen)", `${generated.code}: ${generated.subject} [${generated.status}]`);
      } else {
        log.exist("Class (Gen)", `${generated.code}: ${generated.subject} verified`);
      }
    }
  }

  log.header("[6/12] Topic Requests & Directed Notifications");
  const juan = learnerUsers["juan.delacruz@katuwang.test"];
  const maria = tutorUsers["maria.santos@katuwang.test"];
  const mariaProfile = tutorProfiles["maria.santos@katuwang.test"];
  if (juan && maria && mariaProfile) {
    const tr1 = await ensureTopicRequest({
      learnerId: juan.id,
      subject: "MATH",
      gradeLevel: juan.gradeLevel,
      note: "Struggling with distributing and combining like terms.",
      status: "OPEN",
      directedTutorProfileId: mariaProfile.id,
      topics: ["Algebraic Expressions"],
      slots: [{ day: "MONDAY", startTime: "15:00", endTime: "17:00" }],
    });
    if (tr1.isNew) log.add("TopicRequest", `MATH (Algebraic Expressions) from ${juan.anonymousId} [OPEN]`);
    else log.exist("TopicRequest", `MATH request from ${juan.anonymousId} verified`);

    const notif1 = await ensureNotification({
      userId: maria.id,
      type: "TOPIC_REQUEST_DIRECTED",
      message: `${juan.anonymousId} directed a topic request to you (MATH).`,
      link: "/tutor/requests",
    });
    if (notif1.isNew) log.add("Notification", `Sent to ${maria.email} for directed topic request`);
  }

  const carla = learnerUsers["carla.mendoza@katuwang.test"];
  const jose = tutorUsers["jose.reyes@katuwang.test"];
  const joseProfile = tutorProfiles["jose.reyes@katuwang.test"];
  if (carla && jose && joseProfile) {
    const acceptedClass = await ensureTutorClass({
      tutorProfileId: joseProfile.id,
      preferredCode: "C-0014",
      subject: "ENGLISH",
      gradeLevel: carla.gradeLevel,
      description: "Created from Carla's topic request.",
      maxStudents: 3,
      status: "SCHEDULED",
      published: true,
      topics: ["Essay & Paragraph Writing"],
      sessions: [{ topic: "Essay & Paragraph Writing", scheduledAt: inDays(4, 14), duration: 60 }],
      enrolledLearnerIds: [],
    });
    classesList.push(acceptedClass);

    const tr2 = await ensureTopicRequest({
      learnerId: carla.id,
      subject: "ENGLISH",
      gradeLevel: carla.gradeLevel,
      note: "Need help structuring a 5-paragraph essay.",
      status: "ACCEPTED",
      fulfilledClassId: acceptedClass.id,
      topics: ["Essay & Paragraph Writing"],
    });
    if (tr2.isNew) log.add("TopicRequest", `ENGLISH (Essay Writing) from ${carla.anonymousId} [ACCEPTED]`);
    else log.exist("TopicRequest", `ENGLISH request from ${carla.anonymousId} verified`);

    const notif2 = await ensureNotification({
      userId: carla.id,
      type: "TOPIC_REQUEST_ACCEPTED",
      message: "A tutor created a class for your ENGLISH request. Review it and enroll.",
      link: `/learner/classes/${acceptedClass.id}`,
    });
    if (notif2.isNew) log.add("Notification", `Sent to ${carla.email} for accepted topic request`);
  }

  const miguel = learnerUsers["miguel.torres@katuwang.test"];
  const paolo = tutorUsers["paolo.garcia@katuwang.test"];
  const paoloProfile = tutorProfiles["paolo.garcia@katuwang.test"];
  if (miguel && paolo && paoloProfile) {
    const enrolledClass = await ensureTutorClass({
      tutorProfileId: paoloProfile.id,
      preferredCode: "C-0015",
      subject: "SCIENCE",
      gradeLevel: miguel.gradeLevel,
      description: "Created from Miguel's topic request.",
      maxStudents: 2,
      status: "SCHEDULED",
      published: true,
      topics: ["Chemical Reactions & Matter"],
      sessions: [{ topic: "Chemical Reactions & Matter", scheduledAt: inDays(2, 13), duration: 60 }],
      enrolledLearnerIds: [miguel.id],
    });
    classesList.push(enrolledClass);

    const tr3 = await ensureTopicRequest({
      learnerId: miguel.id,
      subject: "SCIENCE",
      gradeLevel: miguel.gradeLevel,
      note: "Want to review balancing chemical equations.",
      status: "ENROLLED",
      fulfilledClassId: enrolledClass.id,
      topics: ["Chemical Reactions & Matter"],
    });
    if (tr3.isNew) log.add("TopicRequest", `SCIENCE (Chemical Reactions) from ${miguel.anonymousId} [ENROLLED]`);
    else log.exist("TopicRequest", `SCIENCE request from ${miguel.anonymousId} verified`);

    const notif3 = await ensureNotification({
      userId: miguel.id,
      type: "TOPIC_REQUEST_ACCEPTED",
      message: "A tutor created a class for your SCIENCE request. Review it and enroll.",
      link: `/learner/classes/${enrolledClass.id}`,
      readAt: new Date(),
    });
    if (notif3.isNew) log.add("Notification", `Sent to ${miguel.email} for enrolled topic request`);
  }

  const demoLearner = learnerUsers["demo@learner.test"];
  const demoTutor = tutorUsers["demo@tutor.test"];
  if (demoLearner) {
    await ensureNotification({
      userId: demoLearner.id,
      type: "TOPIC_REQUEST_REOPENED",
      message: "Your MATH topic request is open again — the linked class was cancelled.",
      link: "/learner/requests",
    });
  }
  if (demoTutor) {
    await ensureNotification({
      userId: demoTutor.id,
      type: "TOPIC_REQUEST_DIRECTED",
      message: "A learner directed a topic request to you.",
      link: "/tutor/requests",
      readAt: new Date(),
    });
  }

  // Synchronize CLASS counter
  const currentClassCounter = await prisma.idCounter.findUnique({ where: { role: "CLASS" } });
  const finalClassCount = Math.max(currentClassCounter?.count ?? 0, maxObservedCodeNum);
  await prisma.idCounter.upsert({
    where: { role: "CLASS" },
    create: { role: "CLASS", count: finalClassCount },
    update: { count: finalClassCount },
  });

  // Procedurally generated topic requests
  const scheduledClasses = classesList.filter((c) => c.status === "SCHEDULED");
  for (let i = 0; i < GEN.topicRequests; i++) {
    const learner = rand.pick(Object.values(learnerUsers));
    const subject = rand.pick(ALL_SUBJECTS);
    const topics = rand.sample(SUBJECT_TOPICS[subject], rand.int(1, 3));
    const slotDays = rand.sample(WEEKDAYS, rand.int(0, 3));

    const directedCandidates = Object.entries(tutorProfiles).filter(([email]) =>
      (certifiedByProfile.get(tutorProfiles[email].id) ?? []).some((c) => c.subject === subject)
    );
    const directed = rand.chance(0.1) && directedCandidates.length > 0 ? rand.pick(directedCandidates) : undefined;
    const match = rand.chance(0.12) ? scheduledClasses.find((c) => c.subject === subject) : undefined;

    const res = await ensureTopicRequest({
      learnerId: learner.id,
      subject,
      gradeLevel: rand.chance(0.8) ? learner.gradeLevel : rand.pick(ALL_GRADES),
      note: rand.chance(0.4) ? rand.pick(REQUEST_NOTES) : null,
      status: match ? "FULFILLED" : "OPEN",
      fulfilledClassId: match?.id ?? null,
      directedTutorProfileId: match ? null : directed?.[1].id ?? null,
      topics,
      slots: slotDays.map((day) => {
        const start = rand.int(8, 17);
        return { day, startTime: `${pad(start, 2)}:00`, endTime: `${pad(Math.min(20, start + 2), 2)}:00` };
      }),
    });
    if (res.isNew) {
      log.add("TopicRequest", `[#${i + 1}] ${subject} (${topics.join(", ")}) for ${learner.anonymousId}`);
    } else {
      log.exist("TopicRequest", `[#${i + 1}] ${subject} request verified`);
    }
  }

  log.header("[7/12] Assessment Question Bank & Platform Rules");
  const questionsCreated = await seedQuestionBank(
    superAdminUser.id,
    Object.values(tutorProfiles)[0]?.id ?? null
  );

  log.header("[8/12] Certified Tutor Assessment Exam Attempts");
  for (const [pId, certs] of certifiedByProfile.entries()) {
    for (const c of certs.slice(0, 2)) {
      const res = await ensureTutorAssessmentAttempt(pId, c.subject, c.topic);
      if (res) {
        if (res.isNew) {
          log.add("ExamAttempt", `Passed attempt recorded: ${c.subject} / ${c.topic} (Profile ${pId.slice(-6)})`);
        } else {
          log.exist("ExamAttempt", `Passed attempt verified: ${c.subject} / ${c.topic} (Profile ${pId.slice(-6)})`);
        }
      }
    }
  }

  log.header("[9/12] Pre/Post Session Diagnostic Tests");
  const sessionTestsSeeded = await seedSessionTests();

  log.header("[10/12] Class Moderation Appeals");
  const appealsCreated = await seedClassAppeals(superAdminUser.id, classesList);

  log.header("[11/12] Abuse Reports & Moderation Violations");
  const reportsCreated = await seedReports(
    superAdminUser.id,
    Object.values(learnerUsers),
    tutorUsers,
    tutorProfiles,
    classesList
  );

  log.header("[12/12] Recommendations, Chatbot Misses, Audit Logs & Auth Tokens");
  const recommendationsCreated = await seedClassRecommendations(
    superAdminUser.id,
    classesList,
    Object.values(learnerUsers)
  );

  const missesCreated = await seedChatbotMisses(Object.values(learnerUsers), tutorUsers);

  const auditLogsCreated = await seedAuditLogs(
    superAdminUser.id,
    Object.values(learnerUsers),
    classesList
  );

  // Demo tokens
  if (juan) {
    const existingReset = await prisma.passwordResetToken.findFirst({ where: { userId: superAdminUser.id } });
    if (!existingReset) {
      await prisma.passwordResetToken.create({
        data: {
          userId: superAdminUser.id,
          tokenHash: "demo_admin_reset_token_hash_seed",
          expiresAt: inDays(1),
        },
      });
      log.add("AuthToken", `Created PasswordResetToken for ${superAdminUser.email}`);
    } else {
      log.exist("AuthToken", `Verified PasswordResetToken for ${superAdminUser.email}`);
    }

    const existingVerify = await prisma.verificationToken.findFirst({ where: { userId: juan.id } });
    if (!existingVerify) {
      await prisma.verificationToken.create({
        data: {
          userId: juan.id,
          tokenHash: "demo_learner_verification_token_hash_seed",
          expiresAt: inDays(1),
        },
      });
      log.add("AuthToken", `Created VerificationToken for ${juan.email}`);
    } else {
      log.exist("AuthToken", `Verified VerificationToken for ${juan.email}`);
    }
  }

  const tutorTotal = Object.keys(tutorUsers).length;
  const learnerTotal = Object.keys(learnerUsers).length;
  const classTotal = classesList.length;

  console.log("\n=======================================================");
  console.log("  Katuwang Database Seed Completed Successfully");
  console.log("=======================================================\n");
  console.log(`All seeded accounts use the password: ${DUMMY_PASSWORD}\n`);
  console.log("Database Populations Summary:");
  console.log(`  - Tutors:                 ${tutorTotal}`);
  console.log(`  - Learners:               ${learnerTotal}`);
  console.log(`  - Classes:                ${classTotal}`);
  console.log(`  - Topic Requests:         ${GEN.topicRequests}`);
  console.log(`  - Bank Questions:         ${questionsCreated}`);
  console.log(`  - Session Pre/Post Tests: ${sessionTestsSeeded ? "Configured" : "Skipped"}`);
  console.log(`  - Class Appeals:          ${appealsCreated}`);
  console.log(`  - Abuse Reports:          ${reportsCreated}`);
  console.log(`  - Class Recommendations:  ${recommendationsCreated}`);
  console.log(`  - Chatbot Misses:         ${missesCreated}`);
  console.log(`  - Admin Audit Logs:       ${auditLogsCreated}`);

  console.log("\nAdministrative Accounts:");
  console.log("  ADM-0001  superadmin@katuwang.test (SUPER_ADMIN)");
  console.log("\nDemo Tutors:");
  for (const t of TUTORS) console.log(`  ${tutorUsers[t.email]?.anonymousId}  ${t.email}`);
  console.log("\nDemo Learners:");
  for (const l of LEARNERS) console.log(`  ${learnerUsers[l.email]?.anonymousId}  ${l.email}`);
  console.log("\nModerated Demo Accounts:");
  for (const mod of MODERATED_ACCOUNTS) {
    const acc = mod.tutor ?? mod.learner;
    if (acc) {
      const user = tutorUsers[acc.email] ?? learnerUsers[acc.email];
      console.log(`  ${user?.anonymousId}  ${acc.email} (${acc.status})`);
    }
  }
  console.log("\n=======================================================\n");
}

async function seedClassAppeals(
  adminId: string,
  classes: { id: string; code: string; tutorProfileId: string; status: ClassStatus }[]
): Promise<number> {
  const suspendedClasses = classes.filter((c) => c.status === "SUSPENDED");
  const otherClasses = classes.filter((c) => c.status !== "SUSPENDED");

  const curatedAppeals = [
    {
      classCode: "C-0016",
      reason: "The session covered topics directly aligned with the official Grade 11 Health curriculum. I have uploaded the lesson outline for verification.",
      status: "PENDING" as ClassAppealStatus,
      reviewNote: null,
      reviewedById: null,
      reviewedAt: null,
    },
    {
      classCode: "C-0011",
      reason: "I had an unexpected power outage during the scheduled session time. I have rescheduled and confirmed availability with all enrolled learners.",
      status: "APPROVED" as ClassAppealStatus,
      reviewNote: "Explanation verified with learners. Class reinstated.",
      reviewedById: adminId,
      reviewedAt: inDays(-2),
    },
    {
      classCode: "C-0010",
      reason: "Requesting review of moderation notice regarding grammar workshop syllabus.",
      status: "REJECTED" as ClassAppealStatus,
      reviewNote: "Notice upheld. Please ensure next syllabus aligns with grade level.",
      reviewedById: adminId,
      reviewedAt: inDays(-4),
    },
  ];

  let count = 0;
  for (const a of curatedAppeals) {
    const cls = classes.find((c) => c.code === a.classCode);
    if (!cls) continue;
    const res = await ensureClassAppeal({
      classId: cls.id,
      tutorProfileId: cls.tutorProfileId,
      reason: a.reason,
      status: a.status,
      reviewNote: a.reviewNote,
      reviewedById: a.reviewedById,
      reviewedAt: a.reviewedAt,
    });
    if (res.isNew) {
      log.add("ClassAppeal", `Class ${cls.code} appeal [${a.status}] created`);
    } else {
      log.exist("ClassAppeal", `Class ${cls.code} appeal [${a.status}] verified`);
    }
    count++;
  }

  const remaining = Math.max(0, GEN.classAppeals - count);
  const appealPool = suspendedClasses.length > 0 ? suspendedClasses : otherClasses;
  for (let i = 0; i < remaining && i < appealPool.length; i++) {
    const target = appealPool[i];
    const isPending = i % 2 === 0;
    const res = await ensureClassAppeal({
      classId: target.id,
      tutorProfileId: target.tutorProfileId,
      reason: `Tutor contestation for class moderation #${i + 1}: requesting admin review of session guidelines.`,
      status: isPending ? "PENDING" : "APPROVED",
      reviewNote: isPending ? null : "Review completed and resolved.",
      reviewedById: isPending ? null : adminId,
      reviewedAt: isPending ? null : inDays(-1),
    });
    if (res.isNew) {
      log.add("ClassAppeal", `Class ${target.code} generated appeal created [${isPending ? "PENDING" : "APPROVED"}]`);
    } else {
      log.exist("ClassAppeal", `Class ${target.code} generated appeal verified`);
    }
    count++;
  }

  return count;
}

async function seedReports(
  adminId: string,
  learners: User[],
  tutorUsers: Record<string, User>,
  tutorProfiles: Record<string, TutorProfile>,
  classes: { id: string; code: string }[]
): Promise<number> {
  const carla = learners.find((l) => l.email === "carla.mendoza@katuwang.test") ?? learners[0];
  const juan = learners.find((l) => l.email === "juan.delacruz@katuwang.test") ?? learners[1];
  const miguel = learners.find((l) => l.email === "miguel.torres@katuwang.test") ?? learners[2];
  const joseProfile = tutorProfiles["jose.reyes@katuwang.test"] ?? Object.values(tutorProfiles)[0];
  const paoloProfile = tutorProfiles["paolo.garcia@katuwang.test"] ?? Object.values(tutorProfiles)[1];
  const classTarget = classes.find((c) => c.code === "C-0008") ?? classes[0];

  if (!carla || !joseProfile) return 0;

  const curatedReports = [
    {
      reporterId: carla.id,
      targetType: "TUTOR" as ReportTargetType,
      reportedTutorProfileId: joseProfile.id,
      classId: null,
      details: "Tutor was 25 minutes late to the Google Meet session without sending any prior notice.",
      status: "PENDING" as ReportStatus,
      resolutionNote: null,
      reviewedById: null,
      reviewedAt: null,
      violations: ["NO_SHOW_OR_ABSENCE" as ReportViolationType, "UNPROFESSIONAL_CONDUCT" as ReportViolationType],
    },
    {
      reporterId: juan?.id ?? carla.id,
      targetType: "CLASS" as ReportTargetType,
      reportedTutorProfileId: null,
      classId: classTarget?.id ?? null,
      details: "Session discussion drifted away from the stated topic and syllabus.",
      status: "RESOLVED" as ReportStatus,
      resolutionNote: "Investigated class recording and issued guidance notice to tutor.",
      reviewedById: adminId,
      reviewedAt: inDays(-1),
      violations: ["OFF_TOPIC_SESSIONS" as ReportViolationType],
    },
    {
      reporterId: miguel?.id ?? carla.id,
      targetType: "TUTOR" as ReportTargetType,
      reportedTutorProfileId: paoloProfile?.id ?? joseProfile.id,
      classId: null,
      details: "The tutor practice problem had a typo in the chemical equation.",
      status: "DISMISSED" as ReportStatus,
      resolutionNote: "Minor typo was corrected in session; no academic dishonesty or policy violation.",
      reviewedById: adminId,
      reviewedAt: inDays(-3),
      violations: ["MISLEADING_ACADEMIC_INFO" as ReportViolationType],
    },
  ];

  let count = 0;
  for (const r of curatedReports) {
    const res = await ensureReport(r);
    if (res.isNew) {
      log.add("Report", `${r.targetType} report [${r.violations.join(", ")}] created [${r.status}]`);
    } else {
      log.exist("Report", `${r.targetType} report [${r.status}] verified`);
    }
    count++;
  }

  const remaining = Math.max(0, GEN.reports - count);
  const profilesList = Object.values(tutorProfiles);
  for (let i = 0; i < remaining; i++) {
    const reporter = rand.pick(learners);
    const isTutorTarget = i % 2 === 0;
    const reportedTutor = rand.pick(profilesList);
    const targetClass = rand.pick(classes);
    const isPending = i % 3 === 0;

    const res = await ensureReport({
      reporterId: reporter.id,
      targetType: isTutorTarget ? "TUTOR" : "CLASS",
      reportedTutorProfileId: isTutorTarget ? reportedTutor.id : null,
      classId: isTutorTarget ? null : targetClass.id,
      details: `Generated feedback inquiry #${i + 1} regarding session scheduling and communication clarity.`,
      status: isPending ? "PENDING" : "RESOLVED",
      resolutionNote: isPending ? null : "Admin reviewed and communicated resolution to reporter.",
      reviewedById: isPending ? null : adminId,
      reviewedAt: isPending ? null : inDays(-2),
      violations: [rand.pick(["MISLEADING_CLASS_INFO", "SCHEDULE_ABUSE", "UNPROFESSIONAL_CONDUCT", "OTHER"] as ReportViolationType[])],
    });
    if (res.isNew) {
      log.add("Report", `Generated #${i + 1} against ${isTutorTarget ? "Tutor" : "Class"} [${isPending ? "PENDING" : "RESOLVED"}]`);
    } else {
      log.exist("Report", `Generated #${i + 1} report verified`);
    }
    count++;
  }

  return count;
}

async function seedClassRecommendations(
  adminId: string,
  classes: { id: string; code: string }[],
  learners: User[]
): Promise<number> {
  const carla = learners.find((l) => l.email === "carla.mendoza@katuwang.test") ?? learners[0];
  const juan = learners.find((l) => l.email === "juan.delacruz@katuwang.test") ?? learners[1];
  const kevin = learners.find((l) => l.email === "kevin.bautista@katuwang.test") ?? learners[2];
  const c1 = classes.find((c) => c.code === "C-0001") ?? classes[0];
  const c3 = classes.find((c) => c.code === "C-0003") ?? classes[1];
  const c6 = classes.find((c) => c.code === "C-0006") ?? classes[2];

  if (!carla || !c1) return 0;

  const curated = [
    {
      classId: c1.id,
      classCode: c1.code,
      learnerId: carla.id,
      learnerName: `${carla.firstName} ${carla.lastName}`,
      adminId,
      note: "Recommended based on your interest in Grade 10 Math practice.",
    },
    {
      classId: c3?.id ?? c1.id,
      classCode: c3?.code ?? c1.code,
      learnerId: juan?.id ?? carla.id,
      learnerName: juan ? `${juan.firstName} ${juan.lastName}` : "Juan",
      adminId,
      note: "Small group workshop recommended to prepare for quarterly writing requirements.",
    },
    {
      classId: c6?.id ?? c1.id,
      classCode: c6?.code ?? c1.code,
      learnerId: kevin?.id ?? carla.id,
      learnerName: kevin ? `${kevin.firstName} ${kevin.lastName}` : "Kevin",
      adminId,
      note: "Helpful history review session with open discussions.",
    },
  ];

  let count = 0;
  for (const rec of curated) {
    const res = await ensureClassRecommendation({
      classId: rec.classId,
      learnerId: rec.learnerId,
      adminId: rec.adminId,
      note: rec.note,
    });
    if (res.isNew) {
      log.add("Recommendation", `${rec.classCode} recommended to ${rec.learnerName}`);
    } else {
      log.exist("Recommendation", `${rec.classCode} recommendation for ${rec.learnerName} verified`);
    }
    await ensureNotification({
      userId: rec.learnerId,
      type: "CLASS_RECOMMENDED_BY_ADMIN",
      message: `An administrator recommended a class for you.`,
      link: `/learner/classes/${rec.classId}`,
    });
    count++;
  }

  const remaining = Math.max(0, GEN.recommendations - count);
  for (let i = 0; i < remaining; i++) {
    const learner = rand.pick(learners);
    const cls = rand.pick(classes);
    const res = await ensureClassRecommendation({
      classId: cls.id,
      learnerId: learner.id,
      adminId,
      note: `Personalized academic recommendation #${i + 1} from admin review.`,
    });
    if (res.isNew) {
      log.add("Recommendation", `Rec #${i + 1}: ${cls.code} recommended to ${learner.anonymousId}`);
    } else {
      log.exist("Recommendation", `Rec #${i + 1} verified`);
    }
    count++;
  }

  return count;
}

async function seedChatbotMisses(learners: User[], tutorUsers: Record<string, User>): Promise<number> {
  const learner = learners[0];
  const tutor = Object.values(tutorUsers)[0];

  const curated = [
    { message: "How do I download the certificate of completion?", role: "STUDENT_LEARNER" as Role, userId: learner?.id },
    { message: "Can I request a tutor specifically from section Bonifacio?", role: "STUDENT_LEARNER" as Role, userId: learner?.id },
    { message: "What happens if my internet disconnects during a quiz?", role: "STUDENT_TUTOR" as Role, userId: tutor?.id },
    { message: "Where is room 302 located in the building?", role: "STUDENT_LEARNER" as Role, userId: null },
    { message: "Is there tutoring available during summer break?", role: "STUDENT_LEARNER" as Role, userId: null },
    { message: "Can I teach more than 3 classes simultaneously?", role: "STUDENT_TUTOR" as Role, userId: tutor?.id },
    { message: "How can I change my registered email address?", role: "STUDENT_LEARNER" as Role, userId: learner?.id },
    { message: "What is the passing score for the tutor certification exam?", role: "STUDENT_TUTOR" as Role, userId: tutor?.id },
  ];

  let count = 0;
  for (const m of curated) {
    const res = await ensureChatbotMiss(m);
    if (res.isNew) {
      log.add("ChatbotMiss", `[${m.role}] "${m.message}"`);
    } else {
      log.exist("ChatbotMiss", `[${m.role}] "${m.message.slice(0, 40)}..." verified`);
    }
    count++;
  }

  const remaining = Math.max(0, GEN.chatbotMisses - count);
  for (let i = 0; i < remaining; i++) {
    const role = i % 2 === 0 ? "STUDENT_LEARNER" : "STUDENT_TUTOR";
    const res = await ensureChatbotMiss({
      message: `Inquiry question #${i + 1} regarding study materials and schedule coordination`,
      role: role as Role,
      userId: null,
    });
    if (res.isNew) {
      log.add("ChatbotMiss", `[${role}] "Inquiry question #${i + 1} regarding study materials..."`);
    } else {
      log.exist("ChatbotMiss", `Inquiry #${i + 1} verified`);
    }
    count++;
  }

  return count;
}

async function seedAuditLogs(
  adminId: string,
  users: User[],
  classes: { id: string; code: string }[]
): Promise<number> {
  const sampleUser = users[0];
  const sampleClass = classes[0];

  const curatedLogs = [
    { action: "USER_APPROVED", targetType: "USER", targetId: sampleUser?.id ?? "USR-01", reason: "Approved registration application after identity check.", createdAt: inDays(-12) },
    { action: "USER_STATUS_CHANGE", targetType: "USER", targetId: sampleUser?.id ?? "USR-01", reason: "Suspended user account pending attendance review.", createdAt: inDays(-10) },
    { action: "CLASS_STATUS_CHANGE", targetType: "CLASS", targetId: sampleClass?.id ?? "CLS-01", reason: "Suspended class C-0016 for curriculum moderation review.", createdAt: inDays(-8) },
    { action: "CERTIFICATION_APPROVED", targetType: "CERTIFICATION", targetId: "CERT-01", reason: "Approved tutor certification for Algebraic Expressions (score: 100%).", createdAt: inDays(-7) },
    { action: "CERTIFICATION_REJECTED", targetType: "CERTIFICATION", targetId: "CERT-02", reason: "Rejected certification for PE: practical component missing.", createdAt: inDays(-6) },
    { action: "REPORT_RESOLVED", targetType: "REPORT", targetId: "REP-01", reason: "Resolved learner report #2 regarding session syllabus.", createdAt: inDays(-4) },
    { action: "REPORT_DISMISSED", targetType: "REPORT", targetId: "REP-02", reason: "Dismissed report #3: minor typo corrected in session.", createdAt: inDays(-3) },
    { action: "CLASS_APPEAL_APPROVED", targetType: "CLASS_APPEAL", targetId: "APP-01", reason: "Approved appeal for class C-0011 after learner confirmation.", createdAt: inDays(-2) },
    { action: "CLASS_APPEAL_REJECTED", targetType: "CLASS_APPEAL", targetId: "APP-02", reason: "Upheld moderation: unexcused absence policy breached.", createdAt: inDays(-2) },
    { action: "ASSESSMENT_CONFIG_UPDATED", targetType: "ASSESSMENT_CONFIG", targetId: "GLOBAL", reason: "Updated global assessment pass percentage to 60%.", createdAt: inDays(-1) },
    { action: "QUESTION_REQUEST_RESOLVED", targetType: "QUESTION_REQUEST", targetId: "QR-01", reason: "Stocked 5 new Trigonometry questions in bank.", createdAt: inDays(-1) },
    { action: "SUBJECT_CREATED", targetType: "SUBJECT", targetId: "SUBJ-MAPEH", reason: "Added MAPEH to subject catalog.", createdAt: inDays(-14) },
  ];

  let count = 0;
  for (const logItem of curatedLogs) {
    const res = await ensureAuditLog({
      adminId,
      action: logItem.action,
      targetType: logItem.targetType,
      targetId: logItem.targetId,
      reason: logItem.reason,
      createdAt: logItem.createdAt,
    });
    if (res.isNew) {
      log.add("AuditLog", `[${logItem.action}] on ${logItem.targetType}:${logItem.targetId} (${logItem.reason})`);
    } else {
      log.exist("AuditLog", `[${logItem.action}] verified`);
    }
    count++;
  }

  const remaining = Math.max(0, GEN.auditLogs - count);
  for (let i = 0; i < remaining; i++) {
    const act = rand.pick(["USER_STATUS_CHANGE", "CLASS_STATUS_CHANGE", "REPORT_RESOLVED", "QUESTION_UPDATED"]);
    const res = await ensureAuditLog({
      adminId,
      action: act,
      targetType: act.startsWith("USER") ? "USER" : act.startsWith("CLASS") ? "CLASS" : "REPORT",
      targetId: `LOG-TGT-${pad(i + 1)}`,
      reason: `Routine admin review action #${i + 1} performed.`,
      createdAt: inDays(-rand.int(1, 14)),
    });
    if (res.isNew) {
      log.add("AuditLog", `[${act}] Generated action #${i + 1} recorded`);
    } else {
      log.exist("AuditLog", `[${act}] Generated action #${i + 1} verified`);
    }
    count++;
  }

  return count;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
