import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { createTransportMock, sendMailMock, resendSendMock, resendConstructorMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test" });
  const resendSendMock = vi.fn().mockResolvedValue({ data: { id: "resend-msg-123" }, error: null });
  const resendConstructorMock = vi.fn(function (this: unknown) {
    return {
      emails: { send: resendSendMock },
    };
  });
  return {
    sendMailMock,
    createTransportMock: vi.fn(() => ({ sendMail: sendMailMock })),
    resendSendMock,
    resendConstructorMock,
  };
});

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}));

vi.mock("resend", () => ({
  Resend: resendConstructorMock,
}));

const SMTP_ENV = {
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "apikey",
  SMTP_PASS: "secret",
  MAIL_FROM: "Katuwang <no-reply@katuwang.test>",
};

const RESEND_ENV = {
  RESEND_API_KEY: "re_test_123456789",
  RESEND_FROM: "Katuwang <notifications@katuwang.edu.ph>",
};

/** Fresh import of the module under test with the given env applied. */
async function loadMail(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.unstubAllEnvs();
  // Clear cached clients on globalThis
  delete (globalThis as Record<string, unknown>).mailTransporter;
  delete (globalThis as Record<string, unknown>).resendClient;

  for (const key of [
    "RESEND_API_KEY",
    "RESEND_FROM",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_SECURE",
    "MAIL_FROM",
  ]) {
    vi.stubEnv(key, env[key] ?? "");
  }
  return import("@/lib/mail");
}

beforeEach(() => {
  createTransportMock.mockClear();
  sendMailMock.mockClear();
  resendSendMock.mockClear();
  resendConstructorMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isMailConfigured", () => {
  it("is false when neither Resend nor SMTP is configured", async () => {
    const { isMailConfigured } = await loadMail({});
    expect(isMailConfigured()).toBe(false);
  });

  it("is true when RESEND_API_KEY is configured", async () => {
    const { isMailConfigured } = await loadMail({ RESEND_API_KEY: "re_test_key" });
    expect(isMailConfigured()).toBe(true);
  });

  it("is true once SMTP_HOST and MAIL_FROM are set without Resend", async () => {
    const { isMailConfigured } = await loadMail(SMTP_ENV);
    expect(isMailConfigured()).toBe(true);
  });
});

describe("sendMail via Resend", () => {
  it("sends via Resend HTTP client when RESEND_API_KEY is provided", async () => {
    const { sendMail } = await loadMail(RESEND_ENV);

    await sendMail({
      to: "learner@school.test",
      subject: "Welcome",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(resendConstructorMock).toHaveBeenCalledWith("re_test_123456789");
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock).toHaveBeenCalledWith({
      from: RESEND_ENV.RESEND_FROM,
      to: ["learner@school.test"],
      subject: "Welcome",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("defaults sender to MAIL_FROM or onboarding@resend.dev when RESEND_FROM is absent", async () => {
    const { sendMail } = await loadMail({
      RESEND_API_KEY: "re_test_key",
      MAIL_FROM: "Katuwang <mailer@example.com>",
    });

    await sendMail({
      to: "tutor@school.test",
      subject: "Reset",
      html: "<p>Link</p>",
      text: "Link",
    });

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Katuwang <mailer@example.com>",
      })
    );
  });

  it("throws error when Resend API returns an error object", async () => {
    const { sendMail } = await loadMail(RESEND_ENV);
    resendSendMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid API key", name: "validation_error" },
    });

    await expect(
      sendMail({ to: "user@test.com", subject: "Test", html: "h", text: "t" })
    ).rejects.toThrow("Resend email delivery failed: Invalid API key (validation_error)");
  });

  it("reuses a single Resend client across calls", async () => {
    const { sendMail } = await loadMail(RESEND_ENV);
    await sendMail({ to: "a@b.test", subject: "1", html: "1", text: "1" });
    await sendMail({ to: "c@d.test", subject: "2", html: "2", text: "2" });
    expect(resendConstructorMock).toHaveBeenCalledTimes(1);
  });
});

describe("sendMail via SMTP fallback", () => {
  it("no-ops (no transport call) when unconfigured", async () => {
    const { sendMail } = await loadMail({});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await expect(
      sendMail({ to: "a@b.test", subject: "s", html: "<p>h</p>", text: "h" })
    ).resolves.toBeUndefined();

    expect(createTransportMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalled();
    info.mockRestore();
  });

  it("sends via nodemailer when SMTP is configured and RESEND_API_KEY is unset", async () => {
    const { sendMail } = await loadMail(SMTP_ENV);

    await sendMail({ to: "user@school.test", subject: "Hi", html: "<p>hi</p>", text: "hi" });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: SMTP_ENV.MAIL_FROM,
      to: "user@school.test",
      subject: "Hi",
      html: "<p>hi</p>",
      text: "hi",
    });
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("propagates an SMTP transport failure to the caller", async () => {
    const { sendMail } = await loadMail(SMTP_ENV);
    sendMailMock.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      sendMail({ to: "a@b.test", subject: "s", html: "h", text: "h" })
    ).rejects.toThrow("smtp down");
  });
});

describe("renderPasswordResetEmail", () => {
  it("puts the reset URL in both bodies and states the 30-minute expiry", async () => {
    const { renderPasswordResetEmail } = await loadMail({});
    const url = "https://katuwang.test/reset-password?token=abc123";
    const { subject, html, text } = renderPasswordResetEmail(url);

    expect(subject).toMatch(/reset/i);
    expect(html).toContain(url);
    expect(text).toContain(url);
    expect(html).toContain("30 minutes");
    expect(text).toContain("30 minutes");
  });
});

describe("renderVerificationEmail", () => {
  it("renders verification link and expiry in both bodies", async () => {
    const { renderVerificationEmail } = await loadMail({});
    const url = "https://katuwang.test/verify-email?token=xyz789";
    const { subject, html, text } = renderVerificationEmail(url);

    expect(subject).toMatch(/verify/i);
    expect(html).toContain(url);
    expect(text).toContain(url);
  });
});
