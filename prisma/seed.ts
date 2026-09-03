import { PrismaClient, Role, GradeLevel, SubjectArea, ClassStatus, SessionStatus, User, TutorProfile } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { SUBJECT_TOPICS } from "../src/lib/subjectTopics";

// .env holds DATABASE_URL; .env.seed (optional, gitignored) holds the SEED_* volume knobs.
loadEnv();
loadEnv({ path: ".env.seed" });

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const DUMMY_PASSWORD = "password123";

// ─── Bulk generation config (opt-in via env vars) ────────────────────────────
// Curated demo accounts above are always created. These add procedurally-
// generated accounts/classes ON TOP, to reach the given totals. Example:
//   SEED_TUTORS=100 SEED_LEARNERS=100 SEED_CLASSES=150 SEED_TOPIC_REQUESTS=40 \
//   SEED_QUESTIONS_PER_TOPIC=15 pnpm exec tsx prisma/seed.ts
//
// SEED_QUESTIONS_PER_TOPIC fills the assessment question bank: every curated
// (subject, topic) is stocked with this many single-answer questions (the two
// hand-written demo topics keep their curated questions and are only topped up
// to this count). Set it to at least the default minBankSize (5) to make a
// topic assessable. 0 = only the two hand-written demo topics.
const GEN = {
  tutors: Math.max(0, Number(process.env.SEED_TUTORS ?? 0) | 0),
  learners: Math.max(0, Number(process.env.SEED_LEARNERS ?? 0) | 0),
  classes: Math.max(0, Number(process.env.SEED_CLASSES ?? 0) | 0),
  topicRequests: Math.max(0, Number(process.env.SEED_TOPIC_REQUESTS ?? 0) | 0),
  questionsPerTopic: Math.max(0, Number(process.env.SEED_QUESTIONS_PER_TOPIC ?? 0) | 0),
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
const ALL_SUBJECTS = Object.keys(SUBJECT_TOPICS) as SubjectArea[];
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

// Sequential class codes (mirrors generateClassCode in src/lib/idGenerator.ts).
let classCodeSeq = 0;
const nextClassCode = () => `C-${pad(++classCodeSeq, 4)}`;

// ─── Anonymous ID helper (mirrors src/lib/idGenerator.ts) ─────────────────────

async function nextAnonymousId(role: "TUTOR" | "LEARNER"): Promise<string> {
  const prefix = role === "TUTOR" ? "TUT" : "STU";
  const updated = await prisma.idCounter.update({
    where: { role },
    data: { count: { increment: 1 } },
  });
  return `${prefix}-${String(updated.count).padStart(4, "0")}`;
}

// ─── Dummy account definitions ──────────────────────────────────────────────

interface TutorSeed {
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel: GradeLevel;
  section: string;
  topicCertifications: {
    subject: SubjectArea;
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
      { subject: "MATH", topic: "Fractions & Decimals", certified: false },
    ],
  },
  {
    email: "jose.reyes@katuwang.test",
    firstName: "Jose",
    lastName: "Reyes",
    gradeLevel: "GRADE_11",
    section: "Bonifacio",
    topicCertifications: [
      { subject: "ENGLISH", topic: "Essay & Paragraph Writing", certified: true },
      {
        subject: "ENGLISH",
        topic: "Grammar & Sentence Structure",
        certified: false,
        rejected: true,
        reviewNote: "Re-take after reviewing subject–verb agreement and clause structure.",
      },
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
    ],
  },
  {
    // Stable demo account for walkthroughs/screenshots — kept last so its anonymous ID doesn't shift the others.
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
  // Stable demo account for walkthroughs/screenshots — kept last so its anonymous ID doesn't shift the others.
  { email: "demo@learner.test", firstName: "Demo", lastName: "Learner", gradeLevel: "GRADE_10", section: "Demo" },
];

// ─── User creation (idempotent — reuses existing accounts on re-run) ─────────

async function ensureUser(
  input: { email: string; firstName: string; lastName: string; gradeLevel: GradeLevel; section: string },
  role: Role,
  passwordHash: string
): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return existing;

  const anonymousId = await nextAnonymousId(role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER");

  return prisma.user.create({
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
    },
  });
}

async function ensureTutorProfile(userId: string, topicCertifications: TutorSeed["topicCertifications"]) {
  const profile = await prisma.tutorProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

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
  }

  return profile;
}

// ─── Class definitions (dates are relative to "now" so they stay fresh) ─────

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
  tutorEmail: string;
  subject: SubjectArea;
  gradeLevel?: GradeLevel;
  topics: string[];
  description: string;
  maxStudents: number;
  meetingLink: string | null;
  status: ClassStatus;
  sessions: SessionSeed[];
  enrolledLearnerEmails: string[];
}

function buildClasses(): ClassSeed[] {
  return [
    {
      // Multi-session course: two sessions, each tackling a different topic.
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
      // Multi-session course.
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
      // Multi-session course.
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
      // Multi-session course.
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
      tutorEmail: "ana.cruz@katuwang.test",
      subject: "FILIPINO",
      topics: ["Balarila (Gramatika)"],
      description: "Sesyong kinansela dahil sa hindi inaasahang salungatan sa iskedyul.",
      maxStudents: 2,
      meetingLink: null,
      status: "CANCELLED",
      // Whole class is CANCELLED, so its one session is cancelled too (matches the
      // cascade behavior the tutor-facing "Cancel Class" action performs).
      sessions: [{ topic: "Balarila (Gramatika)", scheduledAt: inDays(10, 15), duration: 60, status: "CANCELLED" }],
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test"],
    },
    {
      // Demo tutor's classes — demo@learner.test is enrolled here, so logging in as either
      // demo account immediately shows a populated, connected walkthrough.
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
  ];
}

// ─── Procedural generators (only exercised when GEN.* > 0) ───────────────────

function genTutorSeeds(count: number): TutorSeed[] {
  const seeds: TutorSeed[] = [];
  for (let i = 1; i <= count; i++) {
    const certs: TutorSeed["topicCertifications"] = [];
    const seen = new Set<string>();
    for (let c = 0; c < rand.int(1, 4); c++) {
      const subject = rand.pick(ALL_SUBJECTS);
      const topic = rand.pick(SUBJECT_TOPICS[subject]);
      const key = `${subject}::${topic}`;
      if (seen.has(key)) continue;
      seen.add(key);
      certs.push({ subject, topic, certified: rand.chance(0.7) });
    }
    seeds.push({
      email: `gen.tutor.${pad(i)}@seed.katuwang.test`,
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
  subject: SubjectArea;
  status: ClassStatus;
}

/** Builds and persists one procedurally-generated class for a tutor. */
async function createGeneratedClass(
  profileId: string,
  certifiedTopics: { subject: SubjectArea; topic: string }[],
  learnerIds: string[]
): Promise<GeneratedClass> {
  // Prefer a subject the tutor is verified in, so "verified topic" badges show up.
  let subject: SubjectArea;
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

  const created = await prisma.tutorClass.create({
    data: {
      tutorProfileId: profileId,
      code: nextClassCode(),
      subject,
      gradeLevel: rand.chance(0.5) ? rand.pick(ALL_GRADES) : null,
      description: `${subject} session on ${topics.join(", ")}.`,
      maxStudents,
      meetingLink: rand.chance(0.5) ? `https://meet.google.com/seed-${Math.floor(rng() * 1e6)}` : null,
      published: rand.chance(0.85),
      status,
      topics: { create: topics.map((topic) => ({ topic })) },
      sessions: { create: sessions },
      enrollments: { create: enrolledIds.map((learnerId) => ({ learnerId })) },
    },
    select: { id: true, subject: true, status: true },
  });
  return created;
}

// ─── Main ─────────────────────────────────────────────────────────────────

// ─── Assessment question bank (demo data) ──────────────────────────────────

interface QSeed {
  prompt: string;
  explanation?: string;
  options: [string, boolean][]; // [text, isCorrect]
}

const QUESTION_BANK: { subject: SubjectArea; topic: string; questions: QSeed[] }[] = [
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

// Procedurally-generated placeholder MCQs, used to bulk-fill the question bank
// for topics without hand-written questions (see SEED_QUESTIONS_PER_TOPIC).
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

function genQuestionsForTopic(subject: SubjectArea, topic: string, n: number): QSeed[] {
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

  for (const subject of Object.keys(SUBJECT_TOPICS) as SubjectArea[]) {
    for (const topic of SUBJECT_TOPICS[subject]) {
      const hand = curated.get(`${subject}::${topic}`) ?? [];
      if (hand.length === 0 && perTopic === 0) continue;

      // Re-runnable: clear this topic's questions first (cascades to options).
      // A question already used in an AssessmentAttemptItem is FK-locked, so
      // clear those attempt items first (the attempt row itself is untouched).
      const staleQuestions = await prisma.assessmentQuestion.findMany({
        where: { subject, topic },
        select: { id: true },
      });
      if (staleQuestions.length > 0) {
        await prisma.assessmentAttemptItem.deleteMany({
          where: { questionId: { in: staleQuestions.map((q) => q.id) } },
        });
      }
      await prisma.assessmentQuestion.deleteMany({ where: { subject, topic } });

      const questions = [
        ...hand,
        ...genQuestionsForTopic(subject, topic, Math.max(0, perTopic - hand.length)),
      ];

      for (const q of questions) {
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
        created++;
      }
    }
  }

  // One per-topic override so the admin UI shows a non-default config.
  await prisma.topicAssessmentConfig.upsert({
    where: { subject_topic: { subject: "MATH", topic: "Algebraic Expressions" } },
    update: { questionCount: 5, passPercent: 60, minBankSize: 5, updatedById: adminId },
    create: {
      subject: "MATH",
      topic: "Algebraic Expressions",
      questionCount: 5,
      passPercent: 60,
      minBankSize: 5,
      updatedById: adminId,
    },
  });

  // One open question request for a topic with an empty bank, for the admin queue.
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
  }

  return created;
}

async function main() {
  // Initialize counters for both roles
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

  const passwordHash = await bcrypt.hash(DUMMY_PASSWORD, 12);

  // Admin account
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@katuwang.test" },
    update: {},
    create: {
      anonymousId: "ADM-0001",
      firstName: "Katuwang",
      lastName: "Admin",
      email: "admin@katuwang.test",
      password: passwordHash,
      role: "ADMIN",
      gradeLevel: "GRADE_12",
      section: "N/A",
      consentGiven: true,
    },
  });

  // Tutors + tutor profiles / subject applications. `certifiedByProfile` tracks
  // each tutor's CERTIFIED (subject, topic) pairs so generated classes can lean
  // on them.
  const tutorUsers: Record<string, User> = {};
  const tutorProfiles: Record<string, TutorProfile> = {};
  const certifiedByProfile = new Map<string, { subject: SubjectArea; topic: string }[]>();

  const registerTutor = async (t: TutorSeed) => {
    const user = await ensureUser(t, "STUDENT_TUTOR", passwordHash);
    const profile = await ensureTutorProfile(user.id, t.topicCertifications);
    tutorUsers[t.email] = user;
    tutorProfiles[t.email] = profile;
    certifiedByProfile.set(
      profile.id,
      t.topicCertifications.filter((c) => c.certified).map((c) => ({ subject: c.subject, topic: c.topic }))
    );
  };

  for (const t of TUTORS) await registerTutor(t);
  const generatedTutorSeeds = genTutorSeeds(GEN.tutors);
  for (const t of generatedTutorSeeds) await registerTutor(t);

  // Learners
  const learnerUsers: Record<string, User> = {};
  const registerLearner = async (l: LearnerSeed) => {
    learnerUsers[l.email] = await ensureUser(l, "STUDENT_LEARNER", passwordHash);
  };
  for (const l of LEARNERS) await registerLearner(l);
  const generatedLearnerSeeds = genLearnerSeeds(GEN.learners);
  for (const l of generatedLearnerSeeds) await registerLearner(l);

  const allProfileIds = Object.values(tutorProfiles).map((p) => p.id);
  const allLearnerIds = Object.values(learnerUsers).map((u) => u.id);

  // Reset every seeded tutor's classes so this script is safely re-runnable
  // (cascades to ClassTopic, ClassSession and ClassEnrollment rows). Also clears
  // topic requests for seeded learners.
  await prisma.tutorClass.deleteMany({ where: { tutorProfileId: { in: allProfileIds } } });
  await prisma.topicRequest.deleteMany({ where: { learnerId: { in: allLearnerIds } } });

  for (const c of buildClasses()) {
    const invalidTopics = c.topics.filter((topic) => !SUBJECT_TOPICS[c.subject].includes(topic));
    if (invalidTopics.length > 0) {
      throw new Error(`Invalid topic(s) for ${c.subject}: ${invalidTopics.join(", ")}`);
    }

    const invalidSessionTopics = c.sessions.filter((s) => !c.topics.includes(s.topic));
    if (invalidSessionTopics.length > 0) {
      throw new Error(
        `Session topic(s) not in class topics for ${c.subject}: ${invalidSessionTopics.map((s) => s.topic).join(", ")}`
      );
    }

    const tutorProfile = tutorProfiles[c.tutorEmail];
    await prisma.tutorClass.create({
      data: {
        tutorProfileId: tutorProfile.id,
        code: nextClassCode(),
        subject: c.subject,
        gradeLevel: c.gradeLevel ?? null,
        description: c.description,
        maxStudents: c.maxStudents,
        meetingLink: c.meetingLink,
        status: c.status,
        topics: { create: c.topics.map((topic) => ({ topic })) },
        sessions: {
          create: c.sessions.map((s) => ({
            topic: s.topic,
            scheduledAt: s.scheduledAt,
            duration: s.duration,
            status: s.status,
          })),
        },
        enrollments: {
          create: c.enrolledLearnerEmails.map((email) => ({ learnerId: learnerUsers[email].id })),
        },
      },
    });
  }

  // ── Procedurally generated classes ──
  const generatedClasses: GeneratedClass[] = [];
  if (GEN.classes > 0) {
    const profilePool = allProfileIds;
    for (let i = 0; i < GEN.classes; i++) {
      const profileId = rand.pick(profilePool);
      generatedClasses.push(
        await createGeneratedClass(profileId, certifiedByProfile.get(profileId) ?? [], allLearnerIds)
      );
    }
  }

  // ── Curated demo topic requests + notifications (always created, independent
  // of the SEED_TOPIC_REQUESTS knob) — gives the tutor "Accepted by me" tab and
  // the admin moderation page real data out of the box. Also clears any
  // leftover Notification rows for seeded users so this script is re-runnable.
  await prisma.notification.deleteMany({ where: { userId: { in: [...allLearnerIds, ...Object.values(tutorUsers).map((u) => u.id)] } } });

  // 1) A directed OPEN request: Juan → Maria (MATH, certified in "Algebraic Expressions").
  //    Maria gets a TOPIC_REQUEST_DIRECTED notification.
  const juan = learnerUsers["juan.delacruz@katuwang.test"];
  const maria = tutorUsers["maria.santos@katuwang.test"];
  const mariaProfile = tutorProfiles["maria.santos@katuwang.test"];
  if (juan && maria && mariaProfile) {
    await prisma.topicRequest.create({
      data: {
        learnerId: juan.id,
        subject: "MATH",
        gradeLevel: juan.gradeLevel,
        note: "Struggling with distributing and combining like terms.",
        status: "OPEN",
        directedTutorProfileId: mariaProfile.id,
        topics: { create: [{ topic: "Algebraic Expressions" }] },
        slots: { create: [{ day: "MONDAY", startTime: "15:00", endTime: "17:00" }] },
      },
    });
    await prisma.notification.create({
      data: {
        userId: maria.id,
        type: "TOPIC_REQUEST_DIRECTED",
        message: `${juan.anonymousId} directed a topic request to you (MATH).`,
        link: "/tutor/requests",
      },
    });
  }

  // 2) An ACCEPTED request: Carla asks jose.reyes (ENGLISH), who creates a class for it.
  //    Carla is not enrolled yet — she sees "Review & enroll".
  const carla = learnerUsers["carla.mendoza@katuwang.test"];
  const jose = tutorUsers["jose.reyes@katuwang.test"];
  const joseProfile = tutorProfiles["jose.reyes@katuwang.test"];
  if (carla && jose && joseProfile) {
    const acceptedClass = await prisma.tutorClass.create({
      data: {
        tutorProfileId: joseProfile.id,
        code: nextClassCode(),
        subject: "ENGLISH",
        gradeLevel: carla.gradeLevel,
        description: "Created from Carla's topic request.",
        maxStudents: 3,
        status: "SCHEDULED",
        published: true,
        topics: { create: [{ topic: "Essay & Paragraph Writing" }] },
        sessions: { create: [{ topic: "Essay & Paragraph Writing", scheduledAt: inDays(4, 14), duration: 60 }] },
      },
    });
    await prisma.topicRequest.create({
      data: {
        learnerId: carla.id,
        subject: "ENGLISH",
        gradeLevel: carla.gradeLevel,
        note: "Need help structuring a 5-paragraph essay.",
        status: "ACCEPTED",
        fulfilledClassId: acceptedClass.id,
        topics: { create: [{ topic: "Essay & Paragraph Writing" }] },
      },
    });
    await prisma.notification.create({
      data: {
        userId: carla.id,
        type: "TOPIC_REQUEST_ACCEPTED",
        message: "A tutor created a class for your ENGLISH request. Review it and enroll.",
        link: `/learner/classes/${acceptedClass.id}`,
      },
    });
  }

  // 3) An ENROLLED request: Miguel asks paolo.garcia (SCIENCE), accepted AND enrolled.
  const miguel = learnerUsers["miguel.torres@katuwang.test"];
  const paolo = tutorUsers["paolo.garcia@katuwang.test"];
  const paoloProfile = tutorProfiles["paolo.garcia@katuwang.test"];
  if (miguel && paolo && paoloProfile) {
    const enrolledClass = await prisma.tutorClass.create({
      data: {
        tutorProfileId: paoloProfile.id,
        code: nextClassCode(),
        subject: "SCIENCE",
        gradeLevel: miguel.gradeLevel,
        description: "Created from Miguel's topic request.",
        maxStudents: 2,
        status: "SCHEDULED",
        published: true,
        topics: { create: [{ topic: "Chemical Reactions & Matter" }] },
        sessions: { create: [{ topic: "Chemical Reactions & Matter", scheduledAt: inDays(2, 13), duration: 60 }] },
        enrollments: { create: [{ learnerId: miguel.id }] },
      },
    });
    await prisma.topicRequest.create({
      data: {
        learnerId: miguel.id,
        subject: "SCIENCE",
        gradeLevel: miguel.gradeLevel,
        note: "Want to review balancing chemical equations.",
        status: "ENROLLED",
        fulfilledClassId: enrolledClass.id,
        topics: { create: [{ topic: "Chemical Reactions & Matter" }] },
      },
    });
    await prisma.notification.create({
      data: {
        userId: miguel.id,
        type: "TOPIC_REQUEST_ACCEPTED",
        message: "A tutor created a class for your SCIENCE request. Review it and enroll.",
        link: `/learner/classes/${enrolledClass.id}`,
        readAt: new Date(),
      },
    });
  }

  // A couple of extra read/unread notifications so the demo learner/tutor
  // notification pages aren't empty even without the accept/direct flows above.
  const demoLearner = learnerUsers["demo@learner.test"];
  const demoTutor = tutorUsers["demo@tutor.test"];
  if (demoLearner) {
    await prisma.notification.create({
      data: {
        userId: demoLearner.id,
        type: "TOPIC_REQUEST_REOPENED",
        message: "Your MATH topic request is open again — the linked class was cancelled.",
        link: "/learner/requests",
      },
    });
  }
  if (demoTutor) {
    await prisma.notification.create({
      data: {
        userId: demoTutor.id,
        type: "TOPIC_REQUEST_DIRECTED",
        message: "A learner directed a topic request to you.",
        link: "/tutor/requests",
        readAt: new Date(),
      },
    });
  }

  // Keep the "CLASS" counter ahead of every seeded code so API-created classes continue the sequence.
  await prisma.idCounter.upsert({
    where: { role: "CLASS" },
    create: { role: "CLASS", count: classCodeSeq },
    update: { count: classCodeSeq },
  });

  // ── Procedurally generated topic requests ──
  const scheduledClasses = generatedClasses.filter((c) => c.status === "SCHEDULED");
  for (let i = 0; i < GEN.topicRequests; i++) {
    const learner = rand.pick(Object.values(learnerUsers));
    const subject = rand.pick(ALL_SUBJECTS);
    const topics = rand.sample(SUBJECT_TOPICS[subject], rand.int(1, 3));
    const slotDays = rand.sample(WEEKDAYS, rand.int(0, 3));

    // ~10% of requests are directed at one specific tutor certified in this subject.
    const directedCandidates = Object.entries(tutorProfiles).filter(([email]) =>
      (certifiedByProfile.get(tutorProfiles[email].id) ?? []).some((c) => c.subject === subject)
    );
    const directed = rand.chance(0.1) && directedCandidates.length > 0 ? rand.pick(directedCandidates) : undefined;

    // ~12% of requests are already answered with a matching-subject class.
    const match = rand.chance(0.12)
      ? scheduledClasses.find((c) => c.subject === subject)
      : undefined;

    await prisma.topicRequest.create({
      data: {
        learnerId: learner.id,
        subject,
        gradeLevel: rand.chance(0.8) ? learner.gradeLevel : rand.pick(ALL_GRADES),
        note: rand.chance(0.4) ? rand.pick(REQUEST_NOTES) : null,
        status: match ? "FULFILLED" : "OPEN",
        fulfilledClassId: match?.id ?? null,
        directedTutorProfileId: match ? null : directed?.[1].id ?? null,
        topics: { create: topics.map((topic) => ({ topic })) },
        slots: {
          create: slotDays.map((day) => {
            const start = rand.int(8, 17);
            return { day, startTime: `${pad(start, 2)}:00`, endTime: `${pad(Math.min(20, start + 2), 2)}:00` };
          }),
        },
      },
    });
  }

  // ── Assessment question bank (demo) ──
  const questionsCreated = await seedQuestionBank(
    adminUser.id,
    Object.values(tutorProfiles)[0]?.id ?? null
  );

  const tutorTotal = TUTORS.length + generatedTutorSeeds.length;
  const learnerTotal = LEARNERS.length + generatedLearnerSeeds.length;
  const classTotal = buildClasses().length + generatedClasses.length;

  console.log("Seed complete.\n");
  console.log(`All dummy accounts use the password: ${DUMMY_PASSWORD}\n`);
  console.log(
    `Totals — tutors: ${tutorTotal}, learners: ${learnerTotal}, classes: ${classTotal}, topic requests: ${GEN.topicRequests}, bank questions: ${questionsCreated} (${GEN.questionsPerTopic || "curated"} / topic)`
  );
  if (GEN.tutors || GEN.learners || GEN.classes || GEN.topicRequests) {
    console.log("Generated accounts use emails like gen.tutor.001@seed.katuwang.test / gen.learner.001@seed.katuwang.test");
  }
  console.log("\nAdmin:");
  console.log("  ADM-0001  admin@katuwang.test");
  console.log("\nCurated tutors:");
  for (const t of TUTORS) console.log(`  ${tutorUsers[t.email].anonymousId}  ${t.email}`);
  console.log("\nCurated learners:");
  for (const l of LEARNERS) console.log(`  ${learnerUsers[l.email].anonymousId}  ${l.email}`);
  console.log("\nLog in as juan.delacruz@katuwang.test to see a mix of open, full, completed, and cancelled classes.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
