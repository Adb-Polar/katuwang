import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ create: vi.fn(), transaction: vi.fn(), read: vi.fn().mockRejectedValue(new Error("isolated catalog outage")) }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => ({ user: { id: "qa-admin", role: "ADMIN" } }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { subject: { findMany: mocks.read }, assessmentQuestion: { create: mocks.create }, $transaction: mocks.transaction } }));
import { POST } from "@/app/api/admin/assessment-questions/route";
import { invalidateSubjectCache } from "@/lib/subjects";
it("returns retryable 503 and never creates a question when catalog validation is unavailable", async () => {
  invalidateSubjectCache();
  const response = await POST(new NextRequest("http://localhost/qa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject: "MATH", topic: "Algebraic Expressions & Factoring", prompt: "Choose the correct expression for this isolated test.", options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }, { text: "C", isCorrect: false }, { text: "D", isCorrect: false }] }) }));
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ retryable: true });
  expect(response.headers.get("Retry-After")).toBe("5");
  expect(mocks.transaction).not.toHaveBeenCalled();expect(mocks.create).not.toHaveBeenCalled();
});
