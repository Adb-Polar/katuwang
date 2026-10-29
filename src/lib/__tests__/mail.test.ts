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
  for (const key of ["EMAIL_PROVIDER", "BREVO_API_KEY", "BREVO_FROM_EMAIL", "BREVO_FROM_NAME", "RESEND_API_KEY", "RESEND_FROM", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_SECURE", "MAIL_FROM"]) {
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
  vi.unstubAllGlobals();
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


describe("Resend HTTPS delivery", () => {
  it("prefers HTTPS over configured SMTP and sends both email bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "email-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail, isMailConfigured } = await loadMail({ ...SMTP_ENV, RESEND_API_KEY: "test-key", RESEND_FROM: "sender@verified.test" });
    expect(isMailConfigured()).toBe(true);
    await sendMail({ to: "recipient@example.test", subject: "Reset", html: "<p>Reset</p>", text: "Reset" });
    expect(createTransportMock).not.toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(options.body)).toEqual({ from: "sender@verified.test", to: ["recipient@example.test"], subject: "Reset", html: "<p>Reset</p>", text: "Reset" });
  });

  it("reports provider rejection without leaking its response body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const { sendMail } = await loadMail({ RESEND_API_KEY: "test-key", MAIL_FROM: "sender@verified.test" });
    await expect(sendMail({ to: "a@b.test", subject: "s", html: "h", text: "t" })).rejects.toThrow("HTTP 403");
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("fails rather than silently discarding mail when Resend has no sender", async () => {
    const { sendMail, isMailConfigured } = await loadMail({ RESEND_API_KEY: "test-key" });
    expect(isMailConfigured()).toBe(false);
    await expect(sendMail({ to: "a@b.test", subject: "s", html: "h", text: "t" })).rejects.toThrow("Resend requires");
  });
});


describe("Brevo HTTPS delivery", () => {
  const env = { EMAIL_PROVIDER: "brevo", BREVO_API_KEY: "test-brevo-key", BREVO_FROM_EMAIL: "verified@example.test" };
  const message = { to: "recipient@example.test", subject: "Reset", html: "<p>Reset</p>", text: "Reset" };

  it("uses Brevo with existing Resend and SMTP credentials present", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messageId: "brevo-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail, isMailConfigured } = await loadMail({ ...SMTP_ENV, RESEND_API_KEY: "other-key", ...env });
    expect(isMailConfigured()).toBe(true);
    await sendMail(message);
    expect(createTransportMock).not.toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(options.headers["api-key"]).toBe(env.BREVO_API_KEY);
    expect(options.cache).toBe("no-store");
    expect(JSON.parse(options.body)).toEqual({ sender: { name: "Katuwang", email: env.BREVO_FROM_EMAIL }, to: [{ email: message.to }], subject: message.subject, htmlContent: message.html, textContent: message.text });
  });

  it("does not silently use another provider when Brevo credentials are missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail, isMailConfigured } = await loadMail({ ...SMTP_ENV, EMAIL_PROVIDER: "brevo", RESEND_API_KEY: "other-key" });
    expect(isMailConfigured()).toBe(false);
    await expect(sendMail(message)).rejects.toThrow("Brevo requires");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("propagates API rejection without falling back or exposing response content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { sendMail } = await loadMail(env);
    await expect(sendMail(message)).rejects.toThrow("Brevo email delivery failed (HTTP 401)");
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("does not report acceptance without a message ID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    const { sendMail } = await loadMail(env);
    await expect(sendMail(message)).rejects.toThrow("Brevo did not return a message ID");
  });

  it("propagates network failure without using SMTP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network timeout")));
    const { sendMail } = await loadMail(env);
    await expect(sendMail(message)).rejects.toThrow("network timeout");
    expect(createTransportMock).not.toHaveBeenCalled();
  });
});
