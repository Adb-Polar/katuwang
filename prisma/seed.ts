import { PrismaClient, Role, GradeLevel, SubjectArea, ClassStatus, User, TutorProfile } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { SUBJECT_TOPICS } from "../src/lib/subjectTopics";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const DUMMY_PASSWORD = "password123";

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
  topicCertifications: { subject: SubjectArea; topic: string; certified: boolean }[];
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
      { subject: "ENGLISH", topic: "Grammar & Sentence Structure", certified: false },
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
    topicCertifications: [{ subject: "MAPEH", topic: "Physical Education & Sports", certified: false }],
  },
];

const LEARNERS: LearnerSeed[] = [
  { email: "juan.delacruz@katuwang.test", firstName: "Juan", lastName: "Dela Cruz", gradeLevel: "GRADE_10", section: "Rizal" },
  { email: "carla.mendoza@katuwang.test", firstName: "Carla", lastName: "Mendoza", gradeLevel: "GRADE_9", section: "Bonifacio" },
  { email: "miguel.torres@katuwang.test", firstName: "Miguel", lastName: "Torres", gradeLevel: "GRADE_11", section: "Mabini" },
  { email: "angela.ramos@katuwang.test", firstName: "Angela", lastName: "Ramos", gradeLevel: "GRADE_12", section: "Aguinaldo" },
  { email: "kevin.bautista@katuwang.test", firstName: "Kevin", lastName: "Bautista", gradeLevel: "GRADE_8", section: "Luna" },
  { email: "sofia.villanueva@katuwang.test", firstName: "Sofia", lastName: "Villanueva", gradeLevel: "GRADE_10", section: "Rizal" },
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
    const status = tc.certified ? "CERTIFIED" : "PENDING";
    await prisma.topicCertification.upsert({
      where: {
        tutorProfileId_subject_topic: { tutorProfileId: profile.id, subject: tc.subject, topic: tc.topic },
      },
      update: { status, certifiedAt: tc.certified ? new Date() : null },
      create: {
        tutorProfileId: profile.id,
        subject: tc.subject,
        topic: tc.topic,
        status,
        certifiedAt: tc.certified ? new Date() : null,
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

interface ClassSeed {
  tutorEmail: string;
  subject: SubjectArea;
  topics: string[];
  description: string;
  scheduledAt: Date;
  duration: number;
  maxStudents: number;
  meetingLink: string | null;
  status: ClassStatus;
  enrolledLearnerEmails: string[];
}

function buildClasses(): ClassSeed[] {
  return [
    {
      tutorEmail: "maria.santos@katuwang.test",
      subject: "MATH",
      topics: ["Algebraic Expressions", "Linear Equations & Inequalities"],
      description: "Review of algebraic expressions and solving linear equations, with practice problems.",
      scheduledAt: inDays(2),
      duration: 60,
      maxStudents: 2,
      meetingLink: "https://meet.google.com/math-review-1",
      status: "SCHEDULED",
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test"],
    },
    {
      tutorEmail: "maria.santos@katuwang.test",
      subject: "MATH",
      topics: ["Geometry & Measurement"],
      description: "Intro session on area, perimeter, and volume problems for upcoming exams.",
      scheduledAt: inDays(5),
      duration: 90,
      maxStudents: 1,
      meetingLink: null,
      status: "SCHEDULED",
      enrolledLearnerEmails: [],
    },
    {
      tutorEmail: "jose.reyes@katuwang.test",
      subject: "ENGLISH",
      topics: ["Essay & Paragraph Writing", "Reading Comprehension"],
      description: "Small group workshop on structuring a five-paragraph essay.",
      scheduledAt: inDays(3),
      duration: 60,
      maxStudents: 3,
      meetingLink: "https://meet.google.com/essay-workshop",
      status: "SCHEDULED",
      enrolledLearnerEmails: ["carla.mendoza@katuwang.test", "miguel.torres@katuwang.test"],
    },
    {
      tutorEmail: "jose.reyes@katuwang.test",
      subject: "ENGLISH",
      topics: ["Public Speaking & Oral Communication"],
      description: "1-on-1 coaching for an upcoming class declamation piece.",
      scheduledAt: inDays(1, 10),
      duration: 45,
      maxStudents: 1,
      meetingLink: "https://meet.google.com/declam-coaching",
      status: "SCHEDULED",
      enrolledLearnerEmails: ["angela.ramos@katuwang.test"],
    },
    {
      tutorEmail: "ana.cruz@katuwang.test",
      subject: "FILIPINO",
      topics: ["Panitikang Pilipino", "Pagsulat ng Sanaysay"],
      description: "Talakayan ng mga akda at gawaing pagsulat para sa quarterly exam.",
      scheduledAt: inDays(4),
      duration: 60,
      maxStudents: 2,
      meetingLink: null,
      status: "SCHEDULED",
      enrolledLearnerEmails: [],
    },
    {
      tutorEmail: "ana.cruz@katuwang.test",
      subject: "ARALING_PANLIPUNAN",
      topics: ["Kasaysayan ng Pilipinas"],
      description: "Group review ng mahahalagang pangyayari bago ang Rebolusyong Pilipino.",
      scheduledAt: inDays(6),
      duration: 60,
      maxStudents: 4,
      meetingLink: "https://meet.google.com/kasaysayan-review",
      status: "SCHEDULED",
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test", "sofia.villanueva@katuwang.test"],
    },
    {
      tutorEmail: "paolo.garcia@katuwang.test",
      subject: "SCIENCE",
      topics: ["Chemical Reactions & Matter", "Force, Motion & Energy"],
      description: "Lab-style walkthrough of common chemical reaction and motion problems.",
      scheduledAt: inDays(7),
      duration: 90,
      maxStudents: 2,
      meetingLink: null,
      status: "SCHEDULED",
      enrolledLearnerEmails: [],
    },
    {
      tutorEmail: "liza.fernandez@katuwang.test",
      subject: "MAPEH",
      topics: ["Physical Education & Sports"],
      description: "Group session covering PE performance task requirements.",
      scheduledAt: inDays(2, 9),
      duration: 30,
      maxStudents: 5,
      meetingLink: "https://meet.google.com/pe-performance-task",
      status: "SCHEDULED",
      enrolledLearnerEmails: ["kevin.bautista@katuwang.test"],
    },
    {
      tutorEmail: "maria.santos@katuwang.test",
      subject: "MATH",
      topics: ["Fractions & Decimals"],
      description: "Completed review session on converting fractions to decimals.",
      scheduledAt: inDays(-3),
      duration: 60,
      maxStudents: 2,
      meetingLink: null,
      status: "COMPLETED",
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test"],
    },
    {
      tutorEmail: "jose.reyes@katuwang.test",
      subject: "ENGLISH",
      topics: ["Grammar & Sentence Structure"],
      description: "Completed grammar drills ahead of the periodic exam.",
      scheduledAt: inDays(-5),
      duration: 60,
      maxStudents: 2,
      meetingLink: null,
      status: "COMPLETED",
      enrolledLearnerEmails: ["carla.mendoza@katuwang.test"],
    },
    {
      tutorEmail: "ana.cruz@katuwang.test",
      subject: "FILIPINO",
      topics: ["Balarila (Gramatika)"],
      description: "Sesyong kinansela dahil sa hindi inaasahang salungatan sa iskedyul.",
      scheduledAt: inDays(8),
      duration: 60,
      maxStudents: 2,
      meetingLink: null,
      status: "CANCELLED",
      enrolledLearnerEmails: ["juan.delacruz@katuwang.test"],
    },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────

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

  const passwordHash = await bcrypt.hash(DUMMY_PASSWORD, 12);

  // Admin account
  await prisma.user.upsert({
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

  // Tutors + tutor profiles / subject applications
  const tutorUsers: Record<string, User> = {};
  const tutorProfiles: Record<string, TutorProfile> = {};
  for (const t of TUTORS) {
    const user = await ensureUser(t, "STUDENT_TUTOR", passwordHash);
    const profile = await ensureTutorProfile(user.id, t.topicCertifications);
    tutorUsers[t.email] = user;
    tutorProfiles[t.email] = profile;
  }

  // Learners
  const learnerUsers: Record<string, User> = {};
  for (const l of LEARNERS) {
    const user = await ensureUser(l, "STUDENT_LEARNER", passwordHash);
    learnerUsers[l.email] = user;
  }

  // Reset dummy tutors' classes so this script is safely re-runnable
  // (cascades to ClassTopic and ClassEnrollment rows).
  await prisma.tutorClass.deleteMany({
    where: { tutorProfileId: { in: Object.values(tutorProfiles).map((p) => p.id) } },
  });

  for (const c of buildClasses()) {
    const invalidTopics = c.topics.filter((topic) => !SUBJECT_TOPICS[c.subject].includes(topic));
    if (invalidTopics.length > 0) {
      throw new Error(`Invalid topic(s) for ${c.subject}: ${invalidTopics.join(", ")}`);
    }

    const tutorProfile = tutorProfiles[c.tutorEmail];
    await prisma.tutorClass.create({
      data: {
        tutorProfileId: tutorProfile.id,
        subject: c.subject,
        description: c.description,
        scheduledAt: c.scheduledAt,
        duration: c.duration,
        maxStudents: c.maxStudents,
        meetingLink: c.meetingLink,
        status: c.status,
        topics: { create: c.topics.map((topic) => ({ topic })) },
        enrollments: {
          create: c.enrolledLearnerEmails.map((email) => ({ learnerId: learnerUsers[email].id })),
        },
      },
    });
  }

  console.log("Seed complete.\n");
  console.log(`All dummy accounts use the password: ${DUMMY_PASSWORD}\n`);
  console.log("Admin:");
  console.log("  ADM-0001  admin@katuwang.test");
  console.log("\nTutors:");
  for (const t of TUTORS) console.log(`  ${tutorUsers[t.email].anonymousId}  ${t.email}`);
  console.log("\nLearners:");
  for (const l of LEARNERS) console.log(`  ${learnerUsers[l.email].anonymousId}  ${l.email}`);
  console.log("\nLog in as juan.delacruz@katuwang.test to see a mix of open, full, completed, and cancelled classes.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
