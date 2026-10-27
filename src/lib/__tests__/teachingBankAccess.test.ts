import { expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { topicCertification: { findMany: query } } }));
import { certifiedBankTopics, certifiedBankWhere } from "@/lib/teachingBankAccess";
it("loads only current CERTIFIED scopes belonging to this account", async () => {
  query.mockResolvedValue([{ subject: "MATH", topic: "Fractions" }]);
  expect(await certifiedBankTopics("qa-tutor")).toEqual([{ subject: "MATH", topic: "Fractions" }]);
  expect(query).toHaveBeenCalledWith({ where: { tutorProfile: { userId: "qa-tutor" }, status: "CERTIFIED" }, select: { subject: true, topic: true } });
});
it("never widens an empty certification scope", () => {
  expect(certifiedBankWhere([])).toEqual({ OR: [] });
});
