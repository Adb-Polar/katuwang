import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../prisma";
import { GET } from "@/app/api/admin/assessment-questions/route";
const auth = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => ({ user: { id: auth.id, role: "ADMIN" } }) }));
describe.skipIf(!process.env.TEST_DATABASE_URL)("question listing with tied timestamps", () => {
  afterAll(async () => prisma.$disconnect());
  it("returns every item exactly once across pages after a bulk seed", async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["127.0.0.1", "localhost"].includes(url.hostname) || !url.pathname.includes("verification")) throw Error("Disposable local verification database required");
    const tag = randomUUID(); const subject = `PAGING-${tag}`;
    const author = await prisma.user.create({ data: { anonymousId: subject, email: `${tag}@example.test`, firstName: "QA", lastName: "Paging", password: "unused", role: "ADMIN", gradeLevel: "GRADE_10", section: "QA" } }); auth.id = author.id;
    try {
      const createdAt = new Date("2026-11-13T00:00:00Z");
      await prisma.assessmentQuestion.createMany({ data: Array.from({ length: 63 }, (_, i) => ({ id: `q-page-${tag}-${i.toString().padStart(3, "0")}`, subject, topic: "Bulk seeded topic", prompt: `Synthetic pagination question ${i}`, origin: "BANK" as const, createdById: author.id, createdAt })) });
      const actual: string[] = [];
      for (let page = 1; page <= 7; page++) {
        const r = await GET(new NextRequest(`http://localhost/api/admin/assessment-questions?subject=${subject}&pageSize=10&page=${page}`));
        expect(r.status).toBe(200); const result = await r.json(); expect(result.total).toBe(63); actual.push(...result.questions.map((q: { id: string }) => q.id));
      }
      expect(actual).toHaveLength(63); expect(new Set(actual).size).toBe(63);
      expect(actual).toEqual([...actual].sort().reverse());
    } finally { await prisma.assessmentQuestion.deleteMany({ where: { subject } }); await prisma.user.delete({ where: { id: author.id } }); }
  });
});
