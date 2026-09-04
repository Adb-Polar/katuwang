import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  subjectFindUnique: vi.fn(),
  subjectFindFirst: vi.fn(),
  subjectUpdate: vi.fn(),
  subjectDelete: vi.fn(),
  auditCreate: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: h.getServerSessionMock }));
vi.mock("@/lib/subjects", () => ({ invalidateSubjectCache: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subject: {
      findUnique: h.subjectFindUnique,
      findFirst: h.subjectFindFirst,
      update: h.subjectUpdate,
      delete: h.subjectDelete,
    },
    tutorClass: { count: h.countMock },
    topicRequest: { count: h.countMock },
    topicCertification: { count: h.countMock },
    assessmentQuestion: { count: h.countMock },
    assessmentAttempt: { count: h.countMock },
    questionRequest: { count: h.countMock },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        subject: { update: h.subjectUpdate, delete: h.subjectDelete },
        auditLog: { create: h.auditCreate },
      }),
  },
}));

import { PATCH, DELETE } from "@/app/api/admin/subjects/[id]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const params = { params: Promise.resolve({ id: "s1" }) };
const patch = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/subjects/s1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("/api/admin/subjects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.getServerSessionMock.mockResolvedValue(admin);
    h.subjectFindUnique.mockResolvedValue({ id: "s1", slug: "MATH", name: "Mathematics" });
    h.subjectFindFirst.mockResolvedValue(null);
    h.subjectUpdate.mockResolvedValue({ id: "s1", slug: "MATH", name: "Maths" });
    h.countMock.mockResolvedValue(0);
  });

  it("PATCH toggles active + audits", async () => {
    const res = await PATCH(patch({ active: false }), params);
    expect(res.status).toBe(200);
    expect(h.subjectUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { active: false } }));
    expect(h.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "SUBJECT_UPDATED" }) })
    );
  });

  it("PATCH 404 for a missing subject", async () => {
    h.subjectFindUnique.mockResolvedValue(null);
    expect((await PATCH(patch({ active: false }), params)).status).toBe(404);
  });

  it("DELETE 409 when the subject is in use", async () => {
    h.countMock.mockResolvedValueOnce(3); // tutorClass.count
    const res = await DELETE(new NextRequest("http://localhost/x", { method: "DELETE" }), params);
    expect(res.status).toBe(409);
    expect(h.subjectDelete).not.toHaveBeenCalled();
  });

  it("DELETE 200 + audits when unused", async () => {
    const res = await DELETE(new NextRequest("http://localhost/x", { method: "DELETE" }), params);
    expect(res.status).toBe(200);
    expect(h.subjectDelete).toHaveBeenCalledWith({ where: { id: "s1" } });
    expect(h.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "SUBJECT_DELETED" }) })
    );
  });
});
