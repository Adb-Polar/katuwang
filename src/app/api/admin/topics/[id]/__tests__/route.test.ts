import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  topicFindUnique: vi.fn(),
  topicFindFirst: vi.fn(),
  topicUpdate: vi.fn(),
  topicDelete: vi.fn(),
  auditCreate: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: h.getServerSessionMock }));
vi.mock("@/lib/subjects", () => ({ invalidateSubjectCache: vi.fn() }));
vi.mock("@/lib/prisma", () => {
  const model = { count: h.count, updateMany: h.updateMany };
  return {
    prisma: {
      topic: { findUnique: h.topicFindUnique, findFirst: h.topicFindFirst },
      classTopic: model,
      classSession: model,
      topicRequestTopic: model,
      topicCertification: model,
      assessmentQuestion: model,
      assessmentAttempt: model,
      questionRequest: model,
      $transaction: (fn: (tx: unknown) => unknown) =>
        fn({
          classTopic: model,
          classSession: model,
          topicRequestTopic: model,
          topicCertification: model,
          assessmentQuestion: model,
          assessmentAttempt: model,
          questionRequest: model,
          topic: { update: h.topicUpdate, delete: h.topicDelete },
          auditLog: { create: h.auditCreate },
        }),
    },
  };
});

import { PATCH, DELETE } from "@/app/api/admin/topics/[id]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const params = { params: Promise.resolve({ id: "t1" }) };
const patch = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/topics/t1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("/api/admin/topics/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.getServerSessionMock.mockResolvedValue(admin);
    h.topicFindUnique.mockResolvedValue({
      id: "t1",
      subjectId: "s1",
      name: "Old Name",
      subject: { slug: "MATH" },
    });
    h.topicFindFirst.mockResolvedValue(null);
    h.topicUpdate.mockResolvedValue({ id: "t1", name: "New Name" });
    h.topicDelete.mockResolvedValue({ id: "t1" });
    h.count.mockResolvedValue(0);
    h.updateMany.mockResolvedValue({ count: 0 });
  });

  it("PATCH rename fans out to the denormalised columns", async () => {
    const res = await PATCH(patch({ name: "New Name" }), params);
    expect(res.status).toBe(200);
    // 7 denormalised columns get an updateMany from Old Name -> New Name
    expect(h.updateMany).toHaveBeenCalledTimes(7);
    expect(h.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { topic: "New Name" } })
    );
    expect(h.topicUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "t1" }, data: expect.objectContaining({ name: "New Name" }) })
    );
  });

  it("PATCH order-only change does not fan out", async () => {
    const res = await PATCH(patch({ order: 3 }), params);
    expect(res.status).toBe(200);
    expect(h.updateMany).not.toHaveBeenCalled();
  });

  it("PATCH 409 on a name clash within the subject", async () => {
    h.topicFindFirst.mockResolvedValue({ id: "t2" });
    expect((await PATCH(patch({ name: "Taken" }), params)).status).toBe(409);
  });

  it("DELETE soft-deletes (active:false) when the topic is in use", async () => {
    h.count.mockResolvedValueOnce(2);
    const res = await DELETE(new NextRequest("http://localhost/x", { method: "DELETE" }), params);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.soft).toBe(true);
    expect(h.topicUpdate).toHaveBeenCalledWith({ where: { id: "t1" }, data: { active: false } });
    expect(h.topicDelete).not.toHaveBeenCalled();
  });

  it("DELETE hard-deletes when the topic is unused", async () => {
    const res = await DELETE(new NextRequest("http://localhost/x", { method: "DELETE" }), params);
    const json = await res.json();
    expect(json.soft).toBe(false);
    expect(h.topicDelete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });
});
