import { describe, it, expect, vi, beforeEach } from "vitest";

const { userFindUnique, userUpdate, getSettingMock } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      update: userUpdate,
    },
  },
}));

vi.mock("@/lib/settings", () => ({
  getSetting: getSettingMock,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { GOOGLE_ERROR, authOptions, resolveGoogleSignIn } from "@/lib/auth";

const credentialsProvider = authOptions.providers[0] as unknown as {
  options: {
    authorize: (
      credentials: Record<"email" | "password", string> | undefined
    ) => Promise<unknown>;
  };
};

function authorize(credentials?: Record<"email" | "password", string>) {
  return credentialsProvider.options.authorize(credentials);
}

describe("auth authorize()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Verification off by default — most tests exercise unrelated status branches.
    getSettingMock.mockResolvedValue(false);
  });

  it("throws when email or password is missing", async () => {
    await expect(authorize(undefined)).rejects.toThrow(
      "Email and password are required."
    );
    await expect(authorize({ email: "", password: "x" })).rejects.toThrow(
      "Email and password are required."
    );
  });

  it("throws a generic message when no user is found for the email", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(
      authorize({ email: "nobody@example.com", password: "password123" })
    ).rejects.toThrow("Invalid email or password.");
  });

  it("throws when the password does not match", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authorize({ email: "juan@example.com", password: "wrong" })
    ).rejects.toThrow("Invalid email or password.");
  });

  it("throws when the account is suspended", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "SUSPENDED",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow(/suspended/i);
  });

  it("auto-reactivates and allows login when a suspension has expired", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "SUSPENDED",
      statusExpiresAt: new Date(Date.now() - 1000),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await authorize({ email: "juan@example.com", password: "password123" });

    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "1" },
        data: expect.objectContaining({ status: "ACTIVE", statusExpiresAt: null }),
      })
    );
    expect(result).toEqual({
      id: "1",
      anonymousId: "STU-0001",
      email: "juan@example.com",
      role: "STUDENT_LEARNER",
      isSuperAdmin: false,
      fullName: "Juan Dela Cruz",
    });
  });

  it("still blocks login when a suspension has a future expiry", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "SUSPENDED",
      statusExpiresAt: new Date(Date.now() + 100000),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow(/suspended/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("throws the ACCOUNT_PENDING sentinel when the account is awaiting approval", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "PENDING",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow("ACCOUNT_PENDING");
  });

  it("throws when the account is banned", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "BANNED",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow(/banned/i);
  });

  it("throws the ACCOUNT_DECLINED sentinel (with the reason) when the registration was declined", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "DECLINED",
      statusReason: "Name not on the school roster",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow("ACCOUNT_DECLINED:Name not on the school roster");
  });

  it("throws a bare ACCOUNT_DECLINED sentinel when no reason was recorded", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "DECLINED",
      statusReason: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow(/^ACCOUNT_DECLINED$/);
  });

  it("throws the ACCOUNT_UNVERIFIED sentinel when verification is required and unmet", async () => {
    getSettingMock.mockResolvedValue(true);
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "ACTIVE",
      emailVerifiedAt: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow("ACCOUNT_UNVERIFIED");
  });

  it("checks verification before PENDING approval — an unverified pending account sees ACCOUNT_UNVERIFIED", async () => {
    getSettingMock.mockResolvedValue(true);
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "PENDING",
      emailVerifiedAt: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow("ACCOUNT_UNVERIFIED");
  });

  it("still enforces ACCOUNT_PENDING once the email is verified", async () => {
    getSettingMock.mockResolvedValue(true);
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "PENDING",
      emailVerifiedAt: new Date(),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      authorize({ email: "juan@example.com", password: "password123" })
    ).rejects.toThrow("ACCOUNT_PENDING");
  });

  it("allows login when verification is required and already met", async () => {
    getSettingMock.mockResolvedValue(true);
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await authorize({ email: "juan@example.com", password: "password123" });
    expect(result).toEqual({
      id: "1",
      anonymousId: "STU-0001",
      email: "juan@example.com",
      role: "STUDENT_LEARNER",
      isSuperAdmin: false,
      fullName: "Juan Dela Cruz",
    });
  });

  it("returns the user payload when credentials are valid", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "juan@example.com",
      password: "hashed",
      anonymousId: "STU-0001",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "ACTIVE",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await authorize({
      email: "juan@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      id: "1",
      anonymousId: "STU-0001",
      email: "juan@example.com",
      role: "STUDENT_LEARNER",
      isSuperAdmin: false,
      fullName: "Juan Dela Cruz",
    });
  });
});

describe("super admin claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(false);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  const account = (overrides: Record<string, unknown>) => ({
    id: "9",
    email: "admin@gmail.com",
    password: "hashed",
    anonymousId: "ADM-0001",
    firstName: "Site",
    lastName: "Admin",
    status: "ACTIVE",
    ...overrides,
  });

  it("is true for an ADMIN flagged as super admin", async () => {
    userFindUnique.mockResolvedValue(account({ role: "ADMIN", isSuperAdmin: true }));
    await expect(authorize({ email: "admin@gmail.com", password: "x" })).resolves.toMatchObject({ isSuperAdmin: true });
  });

  it("is false for a regular ADMIN", async () => {
    userFindUnique.mockResolvedValue(account({ role: "ADMIN", isSuperAdmin: false }));
    await expect(authorize({ email: "admin@gmail.com", password: "x" })).resolves.toMatchObject({ isSuperAdmin: false });
  });

  it("is false for a non-admin even if the flag is set", async () => {
    userFindUnique.mockResolvedValue(account({ role: "STUDENT_TUTOR", isSuperAdmin: true }));
    await expect(authorize({ email: "admin@gmail.com", password: "x" })).resolves.toMatchObject({ isSuperAdmin: false });
  });
});

describe("resolveGoogleSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(false);
  });

  const activeUser = { id: "1", email: "juan@gmail.com", role: "STUDENT_LEARNER", status: "ACTIVE" };
  const errorCode = (result: string | true) =>
    typeof result === "string" ? new URL(result, "http://localhost").searchParams.get("error") : null;

  it("allows a verified Google email that matches an active account", async () => {
    userFindUnique.mockResolvedValue(activeUser);
    await expect(resolveGoogleSignIn({ email: "Juan@Gmail.com", email_verified: true })).resolves.toBe(true);
    expect(userFindUnique).toHaveBeenCalledWith({ where: { email: "juan@gmail.com" } });
  });

  it("rejects when no Katuwang account has that email — it never creates one", async () => {
    userFindUnique.mockResolvedValue(null);
    const result = await resolveGoogleSignIn({ email: "stranger@gmail.com", email_verified: true });
    expect(errorCode(result)).toBe(GOOGLE_ERROR.NO_ACCOUNT);
  });

  it("rejects an email Google has not verified, without looking the account up", async () => {
    const result = await resolveGoogleSignIn({ email: "juan@gmail.com", email_verified: false });
    expect(errorCode(result)).toBe(GOOGLE_ERROR.UNVERIFIED);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a profile with no email", async () => {
    expect(errorCode(await resolveGoogleSignIn(undefined))).toBe(GOOGLE_ERROR.UNVERIFIED);
  });

  it("rejects a banned account with the same message as a password login", async () => {
    userFindUnique.mockResolvedValue({ ...activeUser, status: "BANNED" });
    const result = await resolveGoogleSignIn({ email: "juan@gmail.com", email_verified: true });
    expect(errorCode(result)).toBe("Your account has been banned.");
  });

  it("rejects a suspended account", async () => {
    userFindUnique.mockResolvedValue({ ...activeUser, status: "SUSPENDED", statusExpiresAt: null });
    const result = await resolveGoogleSignIn({ email: "juan@gmail.com", email_verified: true });
    expect(errorCode(result)).toMatch(/suspended/);
  });

  it("passes the ACCOUNT_PENDING sentinel through for an unapproved account", async () => {
    userFindUnique.mockResolvedValue({ ...activeUser, status: "PENDING" });
    const result = await resolveGoogleSignIn({ email: "juan@gmail.com", email_verified: true });
    expect(errorCode(result)).toBe("ACCOUNT_PENDING");
  });
});

describe("jwt callback", () => {
  const jwt = authOptions.callbacks!.jwt! as unknown as (args: Record<string, unknown>) => Promise<Record<string, unknown>>;

  beforeEach(() => vi.clearAllMocks());

  it("swaps a Google profile for the Katuwang account that owns the email", async () => {
    userFindUnique.mockResolvedValue({
      id: "db-1",
      anonymousId: "STU-0001",
      email: "juan@gmail.com",
      role: "STUDENT_LEARNER",
      firstName: "Juan",
      lastName: "Dela Cruz",
      isSuperAdmin: false,
    });

    const token = await jwt({
      token: {},
      user: { id: "google-sub-123", email: "juan@gmail.com" },
      account: { provider: "google" },
    });

    expect(token).toMatchObject({ id: "db-1", anonymousId: "STU-0001", role: "STUDENT_LEARNER", isSuperAdmin: false });
  });

  it("fails the Google sign-in if the account vanished between the two callbacks", async () => {
    userFindUnique.mockResolvedValue(null);
    await expect(
      jwt({ token: {}, user: { id: "google-sub-123", email: "gone@gmail.com" }, account: { provider: "google" } })
    ).rejects.toThrow(/No Katuwang account/);
  });

  it("uses the authorize() payload as-is for a password sign-in", async () => {
    const token = await jwt({
      token: {},
      user: { id: "db-2", anonymousId: "ADM-0001", role: "ADMIN", isSuperAdmin: true, fullName: "Site Admin" },
      account: { provider: "credentials" },
    });

    expect(token).toMatchObject({ id: "db-2", isSuperAdmin: true });
    expect(userFindUnique).not.toHaveBeenCalled();
  });
});

describe("auth session config", () => {
  it("uses jwt strategy with an 8 hour session", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
    expect(authOptions.session?.maxAge).toBe(8 * 60 * 60);
  });
});
