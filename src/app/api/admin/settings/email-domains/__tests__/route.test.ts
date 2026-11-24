import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, settingFindUnique, settingUpsert } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  settingFindUnique: vi.fn(),
  settingUpsert: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { platformSetting: { findUnique: settingFindUnique, upsert: settingUpsert } },
}));

import { GET, PUT } from "@/app/api/admin/settings/email-domains/route";
import { DEFAULT_ALLOWED_EMAIL_DOMAINS } from "@/lib/emailDomains";

const admin = { user: { id: "a1", role: "ADMIN" } };
const put = (body: unknown) =>
  PUT(
    new NextRequest("http://localhost/api/admin/settings/email-domains", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    })
  );

describe("/api/admin/settings/email-domains", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(admin);
    settingFindUnique.mockResolvedValue(null);
    settingUpsert.mockResolvedValue({});
  });

  it("GET 401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    expect((await GET()).status).toBe(401);
  });

  it("GET falls back to the defaults when nothing is stored", async () => {
    expect(await (await GET()).json()).toEqual({ domains: DEFAULT_ALLOWED_EMAIL_DOMAINS });
  });

  it("GET returns the stored list", async () => {
    settingFindUnique.mockResolvedValue({ key: "allowedEmailDomains", value: "school.edu.ph,gmail.com" });
    expect(await (await GET()).json()).toEqual({ domains: ["school.edu.ph", "gmail.com"] });
  });

  it("PUT 401 when signed out", async () => {
    getServerSessionMock.mockResolvedValue(null);
    expect((await put({ domains: ["gmail.com"] })).status).toBe(401);
  });

  it("PUT normalises, de-duplicates and stores the list", async () => {
    const res = await put({ domains: ["@Gmail.com", "gmail.com", "school.edu.ph"] });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ domains: ["gmail.com", "school.edu.ph"] });
    expect(settingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { value: "gmail.com,school.edu.ph" } })
    );
  });

  it.each([["qwqe"], ["test.123"]])("PUT 400 for the invalid domain %s", async (domain) => {
    const res = await put({ domains: [domain] });
    expect(res.status).toBe(400);
    expect(settingUpsert).not.toHaveBeenCalled();
  });

  it("PUT 400 for an empty list", async () => {
    expect((await put({ domains: [] })).status).toBe(400);
  });

  it("PUT 500 when the write fails", async () => {
    settingUpsert.mockRejectedValue(new Error("db down"));
    expect((await put({ domains: ["gmail.com"] })).status).toBe(500);
  });
});
