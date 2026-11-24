import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { userFindUnique, userCreate, transactionMock, platformSettingFindUnique, sendMailMock } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  transactionMock: vi.fn(),
  platformSettingFindUnique: vi.fn(),
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      create: userCreate,
    },
    platformSetting: { findUnique: platformSettingFindUnique },
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

vi.mock("@/lib/mail", () => ({
  sendMail: sendMailMock,
  renderVerificationEmail: (url: string) => ({ subject: "s", html: url, text: url }),
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
  email: "juan@gmail.com",
  password: "Tr4vel-mug-lantern",
  gradeLevel: "GRADE_10",
  section: "Rizal",
  consentGiven: true,
};

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformSettingFindUnique.mockResolvedValue(null);
  });

  it("returns 403 when registration is closed", async () => {
    platformSettingFindUnique.mockResolvedValue({ key: "registrationOpen", value: "false" });

    const res = await POST(makeRequest(validLearner));
    expect(res.status).toBe(403);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid input", async () => {
    const res = await POST(makeRequest({ type: "LEARNER" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it.each(["asa@qwqe", "a@test.123", "juan@unlisted.org"])("returns 400 for the unaccepted address %s", async (email) => {
    const res = await POST(makeRequest({ ...validLearner, email }));

    expect(res.status).toBe(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("names the accepted domains when the domain is not on the allowlist", async () => {
    const res = await POST(makeRequest({ ...validLearner, email: "juan@unlisted.org" }));

    const json = await res.json();
    expect(json.error).toContain("@unlisted.org");
    expect(json.error).toContain("@gmail.com");
  });

  it("returns 400 when the recovery email is on an unaccepted domain", async () => {
    const res = await POST(makeRequest({ ...validLearner, recoveryEmail: "parent@unlisted.org" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("@unlisted.org");
  });

  it("accepts a domain an admin added and rejects the old defaults", async () => {
    platformSettingFindUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      Promise.resolve(where.key === "allowedEmailDomains" ? { key: where.key, value: "school.edu.ph" } : null)
    );
    userFindUnique.mockResolvedValue({ id: "existing" });

    const accepted = await POST(makeRequest({ ...validLearner, email: "juan@school.edu.ph" }));
    const rejected = await POST(makeRequest(validLearner));

    expect(accepted.status).toBe(409); // passed the allowlist, reached the duplicate check
    expect(rejected.status).toBe(400);
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
          email: "juan@gmail.com",
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
            email: "tutor@gmail.com",
            role: "STUDENT_TUTOR",
          }),
        },
      })
    );

    const res = await POST(
      makeRequest({
        ...validLearner,
        type: "TUTOR",
        email: "tutor@gmail.com",
      })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.anonymousId).toBe("TUT-0001");
  });

  it("creates a PENDING learner when approval is required", async () => {
    platformSettingFindUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      where.key === "requireRegistrationApproval" ? { key: where.key, value: "true" } : null
    );
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({
      anonymousId: "STU-0001",
      email: validLearner.email,
      role: "STUDENT_LEARNER",
    });

    const res = await POST(makeRequest(validLearner));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.pendingApproval).toBe(true);
    expect(json.message).toMatch(/administrator/i);
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PENDING" }),
      })
    );
  });

  it("issues a verification token and emails a link when verification is required", async () => {
    platformSettingFindUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      where.key === "requireEmailVerification" ? { key: where.key, value: "true" } : null
    );
    userFindUnique.mockResolvedValue(null);
    const verificationCreate = vi.fn().mockResolvedValue({});
    transactionMock.mockImplementation(async (cb) =>
      cb({
        user: {
          create: vi.fn().mockResolvedValue({
            id: "U1",
            anonymousId: "STU-0001",
            email: validLearner.email,
            role: "STUDENT_LEARNER",
          }),
        },
        verificationToken: { create: verificationCreate },
      })
    );

    const res = await POST(makeRequest(validLearner));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.requiresVerification).toBe(true);
    expect(json.message).toMatch(/verification/i);
    expect(verificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "U1" }) })
    );
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0].to).toBe(validLearner.email);
  });

  it("returns 500 when an unexpected error occurs", async () => {
    userFindUnique.mockRejectedValue(new Error("DB down"));

    const res = await POST(makeRequest(validLearner));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/unexpected error/i);
  });
});
