import { describe, it, expect, vi, beforeEach } from "vitest";

const { idCounterUpdate, idCounterUpsert, userFindUnique } = vi.hoisted(() => ({
  idCounterUpdate: vi.fn(),
  idCounterUpsert: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    idCounter: { update: idCounterUpdate, upsert: idCounterUpsert },
    user: { findUnique: userFindUnique },
  },
}));

import { generateAnonymousId, generateClassCode } from "@/lib/idGenerator";

describe("generateAnonymousId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("formats a zero-padded tutor ID", async () => {
    idCounterUpdate.mockResolvedValue({ role: "TUTOR", count: 7 });
    await expect(generateAnonymousId("TUTOR")).resolves.toBe("TUT-0007");
    expect(idCounterUpdate).toHaveBeenCalledWith({
      where: { role: "TUTOR" },
      data: { count: { increment: 1 } },
    });
  });

  it("formats a zero-padded learner ID", async () => {
    idCounterUpdate.mockResolvedValue({ role: "LEARNER", count: 123 });
    await expect(generateAnonymousId("LEARNER")).resolves.toBe("STU-0123");
  });

  it("upserts and bumps count if ADM-0001 already exists", async () => {
    idCounterUpsert.mockResolvedValue({ role: "ADMIN", count: 1 });
    userFindUnique.mockResolvedValue({ id: "existing-seeded-admin" });
    idCounterUpdate.mockResolvedValue({ role: "ADMIN", count: 2 });

    await expect(generateAnonymousId("ADMIN")).resolves.toBe("ADM-0002");
    expect(idCounterUpsert).toHaveBeenCalledWith({
      where: { role: "ADMIN" },
      create: { role: "ADMIN", count: 1 },
      update: { count: { increment: 1 } },
    });
    expect(idCounterUpdate).toHaveBeenCalledWith({
      where: { role: "ADMIN" },
      data: { count: { increment: 1 } },
    });
  });

  it("formats ADM-0001 if not already taken", async () => {
    idCounterUpsert.mockResolvedValue({ role: "ADMIN", count: 1 });
    userFindUnique.mockResolvedValue(null);

    await expect(generateAnonymousId("ADMIN")).resolves.toBe("ADM-0001");
  });
});

describe("generateClassCode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts the CLASS counter and formats C-000N", async () => {
    idCounterUpsert.mockResolvedValue({ role: "CLASS", count: 1 });
    await expect(generateClassCode()).resolves.toBe("C-0001");
    expect(idCounterUpsert).toHaveBeenCalledWith({
      where: { role: "CLASS" },
      create: { role: "CLASS", count: 1 },
      update: { count: { increment: 1 } },
    });
  });

  it("keeps four-digit padding past 1000", async () => {
    idCounterUpsert.mockResolvedValue({ role: "CLASS", count: 4210 });
    await expect(generateClassCode()).resolves.toBe("C-4210");
  });
});
