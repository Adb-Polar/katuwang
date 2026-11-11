import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { seedSubjectCatalog } from "../seedSubjectCatalog";
import { getSubjects, invalidateSubjectCache, topicExists } from "../../src/lib/subjects";

// Explicitly opt into a disposable local database. Never run against inherited live credentials.
describe.skipIf(!process.env.CATALOG_TEST_DATABASE_URL)("catalog import against real MariaDB", () => {
  afterAll(async () => prisma.$disconnect());
  it("is idempotent, preserves history and IDs, respects disables, and enforces sourced grade membership", async () => {
    const target = new URL(process.env.CATALOG_TEST_DATABASE_URL!);
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || process.env.DATABASE_URL !== process.env.CATALOG_TEST_DATABASE_URL || target.pathname !== "/curriculum") {
      throw new Error("Use the disposable local curriculum database for this integration test.");
    }
    const tag = randomUUID();
    const oldSubject = await prisma.subject.create({ data: { slug: `OLD_${tag.slice(0,8)}`, name: `Historical ${tag}`, topics: { create: { name: "Legacy broad topic" } } }, include: { topics:true } });
    const user = await prisma.user.create({ data: { anonymousId: `QA-${tag}`, firstName:"QA",lastName:"History",email:`${tag}@example.test`,password:"test-only-unused-hash",role:"STUDENT_TUTOR",gradeLevel:"GRADE_12",section:"QA",tutorProfile:{create:{}} },include:{tutorProfile:true} });
    const klass = await prisma.tutorClass.create({data:{code:`QA-${tag}`,tutorProfileId:user.tutorProfile!.id,subject:oldSubject.slug,gradeLevel:"GRADE_7",topics:{create:{topic:"Legacy broad topic"}}},include:{topics:true}});
    const request = await prisma.topicRequest.create({data:{learnerId:user.id,subject:oldSubject.slug,gradeLevel:"GRADE_7",expiresAt:new Date(Date.now()+86400000),lastSubmittedAt:new Date(),topics:{create:{topic:"Legacy broad topic"}}},include:{topics:true}});
    const cert = await prisma.topicCertification.create({data:{tutorProfileId:user.tutorProfile!.id,subject:oldSubject.slug,topic:"Legacy broad topic"}});
    const expectedTopic = await prisma.topic.findFirst({where:{subject:{slug:"MATH"},name:"Patterns and Algebra"}});
    const first = await seedSubjectCatalog(prisma);
    const canonical = await prisma.subject.findMany({where:{active:true},include:{topics:{where:{active:true}}}});
    expect(first.totalSubjectsUpserted).toBe(47);
    expect(first.totalTopicsUpserted).toBe(292);
    expect(first.gradeAssociations).toBe(408);
    expect(canonical).toHaveLength(47);
    expect(canonical.reduce((n,s)=>n+s.topics.length,0)).toBe(292);
    const retained = await prisma.topic.findUniqueOrThrow({where:{id:oldSubject.topics[0].id}});
    expect(retained.active).toBe(false);
    expect((await prisma.subject.findUniqueOrThrow({where:{id:oldSubject.id}})).active).toBe(false);
    expect(await prisma.tutorClass.findUnique({where:{id:klass.id},include:{topics:true}})).toEqual(klass);
    expect(await prisma.topicRequest.findUnique({where:{id:request.id},include:{topics:true}})).toEqual(request);
    expect(await prisma.topicCertification.findUnique({where:{id:cert.id}})).toEqual(cert);
    const math = canonical.find(s=>s.slug==="MATH")!;
    const topic = math.topics.find(t=>t.name==="Patterns and Algebra")!;
    if (expectedTopic) expect(topic.id).toBe(expectedTopic.id);
    const identities = canonical.flatMap(s=>s.topics.map(t=>t.id)).sort();
    await prisma.topic.update({where:{id:topic.id},data:{active:false}});
    const biology = canonical.find(s=>s.slug==="SSHS_BIOLOGY_1")!;
    await prisma.subject.update({where:{id:biology.id},data:{active:false}});
    await seedSubjectCatalog(prisma);
    const all = await prisma.subject.findMany({where:{slug:{in:canonical.map(s=>s.slug)}},include:{topics:true}});
    expect(all.flatMap(s=>s.topics.filter(t=>identities.includes(t.id)).map(t=>t.id)).sort()).toEqual(identities);
    expect((await prisma.topic.findUniqueOrThrow({where:{id:topic.id}})).active).toBe(false);
    expect((await prisma.subject.findUniqueOrThrow({where:{id:biology.id}})).active).toBe(false);
    invalidateSubjectCache();
    expect(await topicExists("MATH","Patterns and Algebra",{gradeLevel:"GRADE_7"})).toBe(false);
    expect(await topicExists("MATH","Geometry",{gradeLevel:"GRADE_7"})).toBe(true);
    expect(await topicExists("MATH","Geometry",{gradeLevel:"GRADE_12"})).toBe(false);
    expect(await topicExists("SSHS_BASIC_CALCULUS","Limits and Continuity",{gradeLevel:"GRADE_12"})).toBe(true);
    expect(await topicExists("SSHS_BASIC_CALCULUS","Limits and Continuity",{gradeLevel:"GRADE_11"})).toBe(false);
    expect((await getSubjects()).some(s=>s.slug===oldSubject.slug)).toBe(false);
    // Restore only deliberate test disables; keep the imported catalog for HTTP/browser checks.
    await prisma.topic.update({where:{id:topic.id},data:{active:true}});
    await prisma.subject.update({where:{id:biology.id},data:{active:true}});
    await prisma.topicRequest.delete({where:{id:request.id}});
    await prisma.tutorClass.delete({where:{id:klass.id}});
    await prisma.topicCertification.delete({where:{id:cert.id}});
    await prisma.tutorProfile.delete({where:{id:user.tutorProfile!.id}});
    await prisma.user.delete({where:{id:user.id}});
    await prisma.topic.delete({where:{id:retained.id}});
    await prisma.subject.delete({where:{id:oldSubject.id}});
  },60000);
});
