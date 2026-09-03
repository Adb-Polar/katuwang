import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { createTransportMock, sendMailMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test" });
  return {
    sendMailMock,
    createTransportMock: vi.fn(() => ({ sendMail: sendMailMock })),
  };
});

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}));

const SMTP_ENV = {
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "apikey",
  SMTP_PASS: "secret",
  MAIL_FROM: "Katuwang <no-reply@katuwang.test>",
};

/** Fresh import of the module under test with the given env applied. */
async function loadMail(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.unstubAllEnvs();
  // The transporter is cached on globalThis (survives module reload by design);
  // drop it so each scenario builds its own.
  delete (globalThis as Record<string, unknown>).mailTransporter;
  for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_SECURE", "MAIL_FROM"]) {
    vi.stubEnv(key, env[key] ?? "");
  }
  return import("@/lib/mail");
}

beforeEach(() => {
  createTransportMock.mockClear();
  sendMailMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isMailConfigured", () => {
  it("is false when SMTP_HOST / MAIL_FROM are unset", async () => {
    const { isMailConfigured } = await loadMail({});
    expect(isMailConfigured()).toBe(false);
  });

  it("is true once SMTP_HOST and MAIL_FROM are set", async () => {
    const { isMailConfigured } = await loadMail(SMTP_ENV);
    expect(isMailConfigured()).toBe(true);
  });
});

describe("sendMail", () => {
  it("no-ops (no transport call) when unconfigured", async () => {
    const { sendMail } = await loadMail({});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await expect(
      sendMail({ to: "a@b.test", subject: "s", html: "<p>h</p>", text: "h" })
    ).resolves.toBeUndefined();

    expect(createTransportMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalled();
    info.mockRestore();
  });

  it("sends via the transport with the configured From when configured", async () => {
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
  });

  it("reuses a single transporter across calls", async () => {
    const { sendMail } = await loadMail(SMTP_ENV);
    await sendMail({ to: "a@b.test", subject: "1", html: "1", text: "1" });
    await sendMail({ to: "c@d.test", subject: "2", html: "2", text: "2" });
    expect(createTransportMock).toHaveBeenCalledTimes(1);
  });

  it("propagates a transport failure to the caller", async () => {
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
