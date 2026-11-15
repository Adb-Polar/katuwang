import { afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { GET as tutors } from "@/app/api/learner/tutors/route";
import { GET as classes } from "@/app/api/classes/route";
import { GET as search } from "@/app/api/search/route";
const auth = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => ({ user: { id: auth.id, role: "STUDENT_LEARNER", gradeLevel: "GRADE_10" } }) }));

describe.skipIf(!process.env.TUTOR_SEARCH_TEST_DATABASE_URL)("real database tutor name visibility", () => {
  afterAll(() => prisma.$disconnect());
  it("matches first/last/full names and IDs only when names are visible, with the same behavior across discovery", async () => {
    const raw = process.env.TUTOR_SEARCH_TEST_DATABASE_URL!;
    const target = new URL(raw);
    if (raw !== process.env.DATABASE_URL || target.hostname !== "127.0.0.1" || target.pathname !== "/tutor_name_search_verification") throw Error("Use the isolated disposable tutor_name_search_verification database");
    if (await prisma.user.count()) throw Error("Use an empty disposable database");
    const password = await bcrypt.hash("tutor-search-test-only", 4);
    const common = { password, gradeLevel: "GRADE_10" as const, section: "Synthetic QA", consentGiven: true, emailVerifiedAt: new Date() };
    const learner = await prisma.user.create({ data: { ...common, firstName: "QA", lastName: "Learner", anonymousId: "STU-QA-SEARCH", email: "learner@qa-search.test", role: "STUDENT_LEARNER" } });auth.id = learner.id;
    const people = [];
    for (const [i, firstName, lastName, certified] of [[1, "María Luisa", "Santos", true], [2, "Juan", "Dela Cruz", true], [3, "Santos", "Unverified", false]] as const) {
      const tutor = await prisma.user.create({ data: { ...common, firstName, lastName, email: `tutor${i}@qa-search.test`, anonymousId: `TUT-QA-00${i}`, role: "STUDENT_TUTOR", tutorProfile: { create: { topicCertifications: { create: { subject: "MATH", topic: "Geometry", status: certified ? "CERTIFIED" : "PENDING" } } } } }, include: { tutorProfile: true } });
      people.push(tutor);
      if (certified) await prisma.tutorClass.create({ data: { tutorProfileId: tutor.tutorProfile!.id, code: `QA-NAME-${i}`, subject: "MATH", gradeLevel: "GRADE_10", maxStudents: 4, topics: { create: { topic: "Geometry" } }, sessions: { create: { topic: "Geometry", scheduledAt: new Date("2099-01-01T07:00:00Z"), duration: 60 } } } });
    }
    const subject = await prisma.subject.upsert({ where: { slug: "MATH" }, update: { active: true, gradeLevels: ["GRADE_10"] }, create: { slug: "MATH", name: "Mathematics", gradeLevels: ["GRADE_10"] } });
    await prisma.topic.upsert({ where: { subjectId_name: { subjectId: subject.id, name: "Geometry" } }, update: { active: true, gradeLevels: ["GRADE_10"] }, create: { subjectId: subject.id, name: "Geometry", gradeLevels: ["GRADE_10"] } });
    const flag = async (visible: boolean) => prisma.platformSetting.upsert({ where: { key: "showTutorRealNames" }, create: { key: "showTutorRealNames", value: String(visible) }, update: { value: String(visible) } });
    const get = async (handler: (request: NextRequest) => Promise<Response>, path: string) => { const r = await handler(new NextRequest(`http://localhost${path}`));expect(r.status).toBe(200);return r.json(); };
    for (const visible of [true, false]) {
      await flag(visible);
      for (const term of ["Maria", "Santos", "María Luisa Santos", "mArIa luisa sAntos", "  Maria   Santos  "]) {
        const query = encodeURIComponent(term);
        const list = await get(tutors, `/api/learner/tutors?q=${query}`);
        expect(list.tutors.map((t: { id: string }) => t.id)).toEqual(visible ? [people[0].id] : []);
        expect(list.total).toBe(visible ? 1 : 0);expect(list.showTutorRealNames).toBe(visible);
        const cls = await get(classes, `/api/classes?q=${query}`);
        expect(cls.classes.map((c: { code: string }) => c.code)).toEqual(visible ? ["QA-NAME-1"] : []);
        const quick = await get(search, `/api/search?scope=tutor&q=${query}`);
        expect(quick.groups.flatMap((g: { items: { id: string }[] }) => g.items.map(t => t.id))).toEqual(visible ? [people[0].id] : []);
      }
      const id = await get(tutors, "/api/learner/tutors?q=tut-qa-001");
      expect(id.tutors.map((t: { id: string }) => t.id)).toEqual([people[0].id]);
      expect(id.tutors[0].name).toBe(visible ? "María Luisa Santos" : undefined);
      expect(id.tutors[0]).not.toHaveProperty("email");
      const clsById = await get(classes, "/api/classes?q=TUT-QA-001");
      expect(clsById.classes).toHaveLength(1);expect(clsById.classes[0].tutor.name).toBe(visible ? "María Luisa Santos" : undefined);
      const codeOnly = await get(search, "/api/search?scope=tutorCode&q=Maria");expect(codeOnly.groups).toHaveLength(0);
    }
    await flag(true);
    expect((await get(tutors, "/api/learner/tutors?q=Maria%20Cruz")).total).toBe(0);
    expect((await get(tutors, "/api/learner/tutors?q=Maria&subject=SCIENCE")).total).toBe(0);
    expect((await get(tutors, "/api/learner/tutors?q=Maria&gradeLevel=GRADE_11")).total).toBe(0);
    expect((await get(tutors, "/api/learner/tutors?q=Juan%20Dela%20Cruz")).tutors.map((t: { id: string }) => t.id)).toEqual([people[1].id]);
  }, 120000);
});
