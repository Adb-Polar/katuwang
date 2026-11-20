import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { mockQueryRaw } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
  },
}));

import { GET } from "@/app/api/health/route";

const SECRET = "test-health-secret";

function healthRequest(authorization?: string) {
  const headers = authorization ? { authorization } : undefined;
  return new NextRequest("http://localhost/api/health", { headers });
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("HEALTH_CHECK_SECRET", SECRET);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ["no Authorization header", undefined],
    ["a wrong token", "Bearer wrong-secret"],
    ["the secret without the Bearer scheme", SECRET],
    ["a token that only shares a prefix", `Bearer ${SECRET}x`],
  ])("returns 401 without touching the database for %s", async (_label, authorization) => {
    const response = await GET(healthRequest(authorization));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized." });
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("returns 401 for every request when HEALTH_CHECK_SECRET is unset", async () => {
    vi.stubEnv("HEALTH_CHECK_SECRET", "");

    const response = await GET(healthRequest("Bearer "));

    expect(response.status).toBe(401);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("returns 200 and healthy status when database is reachable", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ 1: 1 }]);

    const response = await GET(healthRequest(`Bearer ${SECRET}`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
    expect(data).toMatchObject({
      status: "healthy",
      database: "connected",
    });
    expect(typeof data.timestamp).toBe("string");
    expect(new Date(data.timestamp).toString()).not.toBe("Invalid Date");
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns 503 and unhealthy status when database check fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sensitiveDbError = new Error("Connection refused at mysql://avnadmin:SUPER_SECRET_PASSWORD@db-host:24446");
    mockQueryRaw.mockRejectedValueOnce(sensitiveDbError);

    const response = await GET(healthRequest(`Bearer ${SECRET}`));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
    expect(data).toMatchObject({
      status: "unhealthy",
      database: "disconnected",
    });
    expect(typeof data.timestamp).toBe("string");

    // Security requirement: Ensure sensitive info and stack traces are not leaked in the response
    expect(JSON.stringify(data)).not.toContain("SUPER_SECRET_PASSWORD");
    expect(JSON.stringify(data)).not.toContain("avnadmin");
    expect(JSON.stringify(data)).not.toContain("Connection refused");
    expect(data.stack).toBeUndefined();
    expect(data.error).toBeUndefined();

    // Verify diagnostic was logged on server
    expect(consoleErrorSpy).toHaveBeenCalledWith("Database health check failed:", sensitiveDbError);
  });
});
