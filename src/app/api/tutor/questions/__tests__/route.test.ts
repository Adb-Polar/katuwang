import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  assessmentQuestionFindMany,
  assessmentQuestionCreate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  assessmentQuestionFindMany: vi.fn(),
  assessmentQuestionCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    assessmentQuestion: { findMany: assessmentQuestionFindMany, create: assessmentQuestionCreate },
  },
}));

import { GET, POST } from "@/app/api/tutor/questions/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };

const validBody = {
  classId: "c1",
  topic: "Algebraic Expressions",
  prompt: "Simplify 2x + 2x",
  options: [
    { text: "4x", isCorrect: true },
    { text: "2x", isCorrect: false },
  ],
};

function post(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/questions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({
    id: "c1",
    tutorProfileId: "tp1",
    status: "SCHEDULED",
    subject: "MATH",
    topics: [{ topic: "Algebraic Expressions" }],
  });
});

describe("GET /api/tutor/questions", () => {
  it("returns only the caller's own TUTOR-origin questions", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    assessmentQuestionFindMany.mockResolvedValue([{ id: "q1" }]);
    const res = await GET(new NextRequest("http://localhost/api/tutor/questions"));
    expect(res.status).toBe(200);
    expect(assessmentQuestionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ origin: "TUTOR", ownerTutorProfileId: "tp1" }),
      })
    );
  });
});

describe("POST /api/tutor/questions", () => {
  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await POST(post(validBody));
    expect(res.status).toBe(401);
  });

  it("400 when the topic is not one of the class's topics", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(post({ ...validBody, topic: "Trigonometry" }));
    expect(res.status).toBe(400);
    expect(assessmentQuestionCreate).not.toHaveBeenCalled();
  });

  it("400 when not exactly one option is correct", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(
      post({ ...validBody, options: [
        { text: "a", isCorrect: true },
        { text: "b", isCorrect: true },
      ] })
    );
    expect(res.status).toBe(400);
  });

  it("201 forces origin TUTOR + owner + class subject", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    assessmentQuestionCreate.mockResolvedValue({ id: "q1", prompt: validBody.prompt, topic: validBody.topic });
    const res = await POST(post(validBody));
    expect(res.status).toBe(201);
    expect(assessmentQuestionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          origin: "TUTOR",
          ownerTutorProfileId: "tp1",
          createdById: "U1",
          subject: "MATH",
          topic: "Algebraic Expressions",
        }),
      })
    );
  });
});
