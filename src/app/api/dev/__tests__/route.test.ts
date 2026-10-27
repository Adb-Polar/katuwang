import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  userFindMany,
  userCount,
  userCreate,
  userUpdate,
  userDeleteMany,
  tutorProfileFindMany,
  tutorProfileFindFirst,
  tutorProfileFindUnique,
  tutorProfileDeleteMany,
  tutorClassFindMany,
  tutorClassCreate,
  tutorClassFindUnique,
  classEnrollmentCreate,
  topicRequestCreate,
  idCounterUpsert,
} = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  userCount: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userDeleteMany: vi.fn(),
  tutorProfileFindMany: vi.fn(),
  tutorProfileFindFirst: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorProfileDeleteMany: vi.fn(),
  tutorClassFindMany: vi.fn(),
  tutorClassCreate: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classEnrollmentCreate: vi.fn(),
  topicRequestCreate: vi.fn(),
  idCounterUpsert: vi.fn(),
  txMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: userFindMany,
      count: userCount,
      create: userCreate,
      update: userUpdate,
      deleteMany: userDeleteMany,
    },
    tutorProfile: {
      findMany: tutorProfileFindMany,
      findFirst: tutorProfileFindFirst,
      findUnique: tutorProfileFindUnique,
      deleteMany: tutorProfileDeleteMany,
    },
    tutorClass: {
      findMany: tutorClassFindMany,
      create: tutorClassCreate,
      findUnique: tutorClassFindUnique,
    },
    classEnrollment: {
      create: classEnrollmentCreate,
    },
    topicRequest: {
      create: topicRequestCreate,
    },
    idCounter: {
      upsert: idCounterUpsert,
    },
    $transaction: (fn: (tx: unknown) => unknown) => fn({
      tutorProfile: { deleteMany: tutorProfileDeleteMany },
      user: { deleteMany: userDeleteMany },
    }),
  },
}));

vi.mock("@/lib/registration", () => ({
  registerAccount: vi.fn().mockResolvedValue({
    ok: true,
    anonymousId: "STU-0099",
    role: "STUDENT_LEARNER",
    pendingApproval: false,
    verificationToken: null,
  }),
}));

import { GET, POST } from "@/app/api/dev/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("NODE_ENV", "development");
  userFindMany.mockResolvedValue([]);
  userCount.mockResolvedValue(0);
  tutorClassFindMany.mockResolvedValue([]);
});

describe("GET /api/dev", () => {
  it("returns 404 in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await GET();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found.");
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns counts and snapshots in development without requiring auth", async () => {
    userFindMany
      .mockResolvedValueOnce([{ id: "t1", anonymousId: "TUT-0001", firstName: "Maria", lastName: "Santos", email: "maria@test.com" }])
      .mockResolvedValueOnce([{ id: "l1", anonymousId: "STU-0001", firstName: "Juan", lastName: "Cruz", email: "juan@test.com" }]);
    userCount
      .mockResolvedValueOnce(1) // admins
      .mockResolvedValueOnce(0); // devUsers
    tutorClassFindMany.mockResolvedValueOnce([
      { id: "c1", code: "C-0001", subject: "MATH", status: "SCHEDULED", maxStudents: 3, _count: { enrollments: 1 } },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.counts).toEqual({
      tutors: 1,
      learners: 1,
      admins: 1,
      classes: 1,
      devUsers: 0,
    });
    expect(json.tutors).toHaveLength(1);
    expect(json.classes).toHaveLength(1);
  });
});

describe("POST /api/dev", () => {
  it("returns 404 in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = new NextRequest("http://localhost/api/dev", {
      method: "POST",
      body: JSON.stringify({ action: "wipeDevData" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns 400 for unknown action", async () => {
    const req = new NextRequest("http://localhost/api/dev", {
      method: "POST",
      body: JSON.stringify({ action: "unknownAction" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Unknown action");
  });

  it("creates learners and sets emailVerifiedAt", async () => {
    userUpdate.mockResolvedValue({});
    const req = new NextRequest("http://localhost/api/dev", {
      method: "POST",
      body: JSON.stringify({ action: "createUsers", role: "STUDENT_LEARNER", count: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.created).toHaveLength(1);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { anonymousId: "STU-0099" },
        data: expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
      }),
    );
  });
});
