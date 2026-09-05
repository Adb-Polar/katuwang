import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classSessionFindUnique,
  sessionTestFindUnique,
  sessionTestCreate,
  sessionTestUpdate,
  sessionTestDelete,
  platformSettingFindUnique,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classSessionFindUnique: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  sessionTestCreate: vi.fn(),
  sessionTestUpdate: vi.fn(),
  sessionTestDelete: vi.fn(),
  platformSettingFindUnique: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classSession: { findUnique: classSessionFindUnique },
    sessionTest: {
      findUnique: sessionTestFindUnique,
      create: sessionTestCreate,
      update: sessionTestUpdate,
      delete: sessionTestDelete,
    },
    platformSetting: { findUnique: platformSettingFindUnique },
  },
}));

import { GET, POST, PATCH, DELETE } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", sessionId: "s1" }) });

function req(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/sessions/s1/test", {
    method,
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } }
      : {}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  platformSettingFindUnique.mockResolvedValue(null); // sessionTestsEnabled defaults to true
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({
    id: "c1",
    tutorProfileId: "tp1",
    status: "SCHEDULED",
    subject: "MATH",
    topics: [{ topic: "Fractions" }],
  });
  classSessionFindUnique.mockResolvedValue({
    id: "s1",
    classId: "c1",
    status: "SCHEDULED",
    scheduledAt: new Date(),
    topic: "Fractions",
  });
  sessionTestFindUnique.mockResolvedValue(null);
});

describe("GET /test", () => {
  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await GET(req("GET"), ctx());
    expect(res.status).toBe(401);
  });

  it("returns test: null when no test exists yet", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await GET(req("GET"), ctx());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.test).toBeNull();
    expect(json.attemptCount).toBe(0);
  });
});

describe("POST /test", () => {
  it("409 when the session already has a test", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionTestFindUnique.mockResolvedValue({
      id: "st1",
      status: "DRAFT",
      questions: [],
      _count: { attempts: 0 },
    });
    const res = await POST(req("POST", { title: "Fractions check-in" }), ctx());
    expect(res.status).toBe(409);
    expect(sessionTestCreate).not.toHaveBeenCalled();
  });

  it("403 when sessionTestsEnabled is off", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    platformSettingFindUnique.mockResolvedValue({ key: "sessionTestsEnabled", value: "false" });
    const res = await POST(req("POST", { title: "Fractions check-in" }), ctx());
    expect(res.status).toBe(403);
    expect(sessionTestCreate).not.toHaveBeenCalled();
  });

  it("201 creates the test scoped to this session", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionTestCreate.mockResolvedValue({ id: "st1", sessionId: "s1", title: "Fractions check-in" });
    const res = await POST(req("POST", { title: "Fractions check-in" }), ctx());
    expect(res.status).toBe(201);
    expect(sessionTestCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sessionId: "s1" }) }),
    );
  });

  it("400 for an invalid title", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(req("POST", { title: "x" }), ctx());
    expect(res.status).toBe(400);
  });
});

describe("PATCH /test", () => {
  it("409 when the test is not DRAFT", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "PUBLISHED", questions: [], _count: { attempts: 0 } });
    const res = await PATCH(req("PATCH", { title: "New title" }), ctx());
    expect(res.status).toBe(409);
  });

  it("saves the update when DRAFT", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [], _count: { attempts: 0 } });
    sessionTestUpdate.mockResolvedValue({ id: "st1", title: "New title" });
    const res = await PATCH(req("PATCH", { title: "New title" }), ctx());
    expect(res.status).toBe(200);
  });
});

describe("DELETE /test", () => {
  it("409 when the test has attempts", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [], _count: { attempts: 2 } });
    const res = await DELETE(req("DELETE"), ctx());
    expect(res.status).toBe(409);
    expect(sessionTestDelete).not.toHaveBeenCalled();
  });

  it("deletes a draft, unattempted test", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [], _count: { attempts: 0 } });
    const res = await DELETE(req("DELETE"), ctx());
    expect(res.status).toBe(200);
    expect(sessionTestDelete).toHaveBeenCalledWith({ where: { id: "st1" } });
  });
});
