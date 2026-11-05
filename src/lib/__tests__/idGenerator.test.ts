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
  beforeEach(() => vi.resetAllMocks());

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
    userFindUnique.mockResolvedValueOnce({ id: "existing-seeded-admin" }).mockResolvedValueOnce(null);
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

  it("skips occupied admin IDs when the counter was reset by seeding", async () => {
    idCounterUpsert.mockResolvedValue({ role: "ADMIN", count: 2 });
    userFindUnique
      .mockResolvedValueOnce({ id: "existing-admin-2" })
      .mockResolvedValueOnce({ id: "existing-admin-3" })
      .mockResolvedValueOnce(null);
    idCounterUpdate
      .mockResolvedValueOnce({ role: "ADMIN", count: 3 })
      .mockResolvedValueOnce({ role: "ADMIN", count: 4 });

    await expect(generateAnonymousId("ADMIN")).resolves.toBe("ADM-0004");
    expect(userFindUnique.mock.calls.map(([args]) => args.where.anonymousId))
      .toEqual(["ADM-0002", "ADM-0003", "ADM-0004"]);
  });

  it("checks occupied IDs even when the admin counter is newly created", async () => {
    idCounterUpsert.mockResolvedValue({ role: "ADMIN", count: 1 });
    userFindUnique
      .mockResolvedValueOnce({ id: "super-admin" })
      .mockResolvedValueOnce({ id: "standard-admin" })
      .mockResolvedValueOnce(null);
    idCounterUpdate
      .mockResolvedValueOnce({ role: "ADMIN", count: 2 })
      .mockResolvedValueOnce({ role: "ADMIN", count: 3 });

    await expect(generateAnonymousId("ADMIN")).resolves.toBe("ADM-0003");
  });

  it("reserves distinct available IDs for concurrent admin requests", async () => {
    let count = 1;
    idCounterUpsert.mockImplementation(async () => ({ role: "ADMIN", count: ++count }));
    idCounterUpdate.mockImplementation(async () => ({ role: "ADMIN", count: ++count }));
    userFindUnique.mockImplementation(async ({ where }) =>
      ["ADM-0002", "ADM-0003"].includes(where.anonymousId) ? { id: "existing" } : null
    );

    const ids = await Promise.all([
      generateAnonymousId("ADMIN"),
      generateAnonymousId("ADMIN"),
    ]);
    expect(new Set(ids).size).toBe(2);
    expect(ids.sort()).toEqual(["ADM-0004", "ADM-0005"]);
  });

  it("formats ADM-0001 if not already taken", async () => {
    idCounterUpsert.mockResolvedValue({ role: "ADMIN", count: 1 });
    userFindUnique.mockResolvedValue(null);

    await expect(generateAnonymousId("ADMIN")).resolves.toBe("ADM-0001");
  });
});

describe("generateClassCode", () => {
  beforeEach(() => vi.resetAllMocks());

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
