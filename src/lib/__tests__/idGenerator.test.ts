import { describe, it, expect, vi, beforeEach } from "vitest";

const { idCounterUpdate, idCounterUpsert } = vi.hoisted(() => ({
  idCounterUpdate: vi.fn(),
  idCounterUpsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    idCounter: { update: idCounterUpdate, upsert: idCounterUpsert },
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
