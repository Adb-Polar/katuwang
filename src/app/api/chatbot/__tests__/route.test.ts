import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, getSettingMock, userFindUniqueMock, chatbotMissCreateMock, classFindManyMock } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    getSettingMock: vi.fn(),
    userFindUniqueMock: vi.fn(),
    chatbotMissCreateMock: vi.fn(),
    classFindManyMock: vi.fn(),
  }));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    chatbotMiss: { create: chatbotMissCreateMock },
    tutorClass: { findMany: classFindManyMock },
  },
}));

import { POST } from "@/app/api/chatbot/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };

function req(body: unknown) {
  return new NextRequest("http://localhost/api/chatbot", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/chatbot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(true);
    userFindUniqueMock.mockResolvedValue({ gradeLevel: "GRADE_9" });
    classFindManyMock.mockResolvedValue([]);
  });

  it("401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(req({ message: "hi" }));
    expect(res.status).toBe(401);
  });

  it("403 when the chatbot is disabled", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    getSettingMock.mockResolvedValue(false);
    const res = await POST(req({ message: "how do I enroll" }));
    expect(res.status).toBe(403);
  });

  it("400 on an empty or oversized message", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    expect((await POST(req({ message: "   " }))).status).toBe(400);
    expect((await POST(req({ message: "x".repeat(501) }))).status).toBe(400);
  });

  it("200 with a matched intent reply and no miss logged", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await POST(req({ message: "how do I enroll in a class" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply.intentId).toBe("nav_enroll");
    expect(json.reply.links?.[0]?.href).toBe("/learner/classes");
    expect(chatbotMissCreateMock).not.toHaveBeenCalled();
  });

  it("logs a ChatbotMiss for an unmatched message", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await POST(req({ message: "asdfghjkl qwerty zxcv" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply.intentId).toBe("fallback");
    expect(chatbotMissCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "STUDENT_LEARNER", userId: "L1" }),
      })
    );
  });
});
