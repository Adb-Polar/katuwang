import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { userFindUnique, userCreate, transactionMock } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      create: userCreate,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/idGenerator", () => ({
  generateAnonymousId: vi.fn().mockResolvedValue("STU-0001"),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

import { POST } from "@/app/api/register/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validLearner = {
  type: "LEARNER",
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan@example.com",
  password: "password123",
  gradeLevel: "GRADE_10",
  section: "Rizal",
  consentGiven: true,
};

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid input", async () => {
    const res = await POST(makeRequest({ type: "LEARNER" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("returns 409 when the email already exists", async () => {
    userFindUnique.mockResolvedValue({ id: "existing-user" });

    const res = await POST(makeRequest(validLearner));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already exists/i);
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("registers a learner successfully", async () => {
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({
      anonymousId: "STU-0001",
      email: validLearner.email,
      role: "STUDENT_LEARNER",
    });

    const res = await POST(makeRequest(validLearner));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.anonymousId).toBe("STU-0001");
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "juan@example.com",
          password: "hashed-password",
          role: "STUDENT_LEARNER",
        }),
      })
    );
  });

  it("registers a tutor successfully via transaction", async () => {
    userFindUnique.mockResolvedValue(null);
    transactionMock.mockImplementation(async (cb) =>
      cb({
        user: {
          create: vi.fn().mockResolvedValue({
            anonymousId: "TUT-0001",
            email: "tutor@example.com",
            role: "STUDENT_TUTOR",
            tutorProfile: { appliedSubjects: [{ subject: "MATH" }] },
          }),
        },
      })
    );

    const res = await POST(
      makeRequest({
        ...validLearner,
        type: "TUTOR",
        email: "tutor@example.com",
        subjects: ["MATH"],
        availability: [{ day: "Monday", startTime: "08:00", endTime: "09:00" }],
      })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.anonymousId).toBe("TUT-0001");
    expect(json.pendingAssessments).toEqual(["MATH"]);
  });

  it("returns 500 when an unexpected error occurs", async () => {
    userFindUnique.mockRejectedValue(new Error("DB down"));

    const res = await POST(makeRequest(validLearner));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/unexpected error/i);
  });
});
