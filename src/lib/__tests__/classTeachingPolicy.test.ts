import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({subject:vi.fn(),topic:vi.fn(),setting:vi.fn(),certs:vi.fn()}));
vi.mock("@/lib/subjects",()=>({subjectExists:mocks.subject,topicExists:mocks.topic}));
vi.mock("@/lib/settings",()=>({getSetting:mocks.setting}));
vi.mock("@/lib/prisma",()=>({prisma:{topicCertification:{findMany:mocks.certs}}}));
import { classTeachingError } from "../classTeachingPolicy";
const scope={tutorProfileId:"qa",tutorGradeLevel:"GRADE_12" as const,subject:"MATH",gradeLevel:"GRADE_7" as const,topics:["Geometry"]};
describe("class curriculum boundary",()=>{
 beforeEach(()=>{vi.resetAllMocks();mocks.subject.mockResolvedValue(true);mocks.topic.mockResolvedValue(true);mocks.setting.mockResolvedValue(false)});
 it("rejects arbitrary topics even when certification is disabled",async()=>{
  mocks.topic.mockResolvedValue(false);
  expect(await classTeachingError({...scope,topics:["My invented topic"]})).toMatch(/active catalog topics/);
  expect(mocks.certs).not.toHaveBeenCalled();
 });
 it("requires grade membership for subject and each topic",async()=>{
  expect(await classTeachingError(scope)).toBeNull();
  expect(mocks.subject).toHaveBeenCalledWith("MATH",{gradeLevel:"GRADE_7"});
  expect(mocks.topic).toHaveBeenCalledWith("MATH","Geometry",{gradeLevel:"GRADE_7"});
  mocks.subject.mockResolvedValue(false);
  expect(await classTeachingError(scope)).toMatch(/selected grade/);
 });
 it("retains the existing certification requirement",async()=>{
  mocks.setting.mockResolvedValue(true);mocks.certs.mockResolvedValue([]);
  expect(await classTeachingError(scope)).toMatch(/not certified/);
 });
});
