import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, subjectFindMany, subjectFindFirst, subjectAggregate, subjectCreate, auditCreate } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    subjectFindMany: vi.fn(),
    subjectFindFirst: vi.fn(),
    subjectAggregate: vi.fn(),
    subjectCreate: vi.fn(),
    auditCreate: vi.fn(),
  }));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/subjects", () => ({ invalidateSubjectCache: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subject: {
      findMany: subjectFindMany,
      findFirst: subjectFindFirst,
      aggregate: subjectAggregate,
      create: subjectCreate,
    },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ subject: { create: subjectCreate }, auditLog: { create: auditCreate } }),
  },
}));

import { GET, POST } from "@/app/api/admin/subjects/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const post = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/subjects", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("/api/admin/subjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subjectAggregate.mockResolvedValue({ _max: { order: 4 } });
    subjectFindFirst.mockResolvedValue(null);
    subjectCreate.mockResolvedValue({ id: "s9", slug: "ROBOTICS", name: "Robotics", order: 5 });
  });

  it("GET 401 for non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { role: "STUDENT_TUTOR" } });
    expect((await GET()).status).toBe(401);
  });

  it("POST 400 on a bad slug", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await POST(post({ name: "Robotics", slug: "robotics!" }));
    expect(res.status).toBe(400);
  });

  it("POST 409 when name/slug already exists", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    subjectFindFirst.mockResolvedValue({ slug: "MATH" });
    const res = await POST(post({ name: "Mathematics", slug: "MATH" }));
    expect(res.status).toBe(409);
  });

  it("POST 201 creates + audits, next order", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await POST(post({ name: "Robotics", slug: "ROBOTICS" }));
    expect(res.status).toBe(201);
    expect(subjectCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "ROBOTICS", order: 5 }) })
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "SUBJECT_CREATED" }) })
    );
  });
});
