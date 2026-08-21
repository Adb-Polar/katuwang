import { describe, it, expect, vi, beforeEach } from "vitest";

const { userFindUnique } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";

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
  });

  it("throws when email or password is missing", async () => {
    await expect(authorize(undefined)).rejects.toThrow(
      "Email and password are required."
    );
    await expect(authorize({ email: "", password: "x" })).rejects.toThrow(
      "Email and password are required."
    );
  });

  it("throws when no user is found for the email", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(
      authorize({ email: "nobody@example.com", password: "password123" })
    ).rejects.toThrow("No account found with that email.");
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
    ).rejects.toThrow("Incorrect password.");
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
      fullName: "Juan Dela Cruz",
    });
  });
});

describe("auth session config", () => {
  it("uses jwt strategy with an 8 hour session", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
    expect(authOptions.session?.maxAge).toBe(8 * 60 * 60);
  });
});
