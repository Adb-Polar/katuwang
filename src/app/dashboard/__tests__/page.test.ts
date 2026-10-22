import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    await DashboardPage();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects to /admin for ADMIN role", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    await DashboardPage();
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("redirects to /admin for SUPER_ADMIN role", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "super-1", role: "SUPER_ADMIN" },
    });
    await DashboardPage();
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("redirects to /tutor for STUDENT_TUTOR role", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "tutor-1", role: "STUDENT_TUTOR" },
    });
    await DashboardPage();
    expect(redirectMock).toHaveBeenCalledWith("/tutor");
  });

  it("redirects to /learner for STUDENT_LEARNER role", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "learner-1", role: "STUDENT_LEARNER" },
    });
    await DashboardPage();
    expect(redirectMock).toHaveBeenCalledWith("/learner");
  });

  it("redirects to /login for unknown role", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "other-1", role: "UNKNOWN_ROLE" },
    });
    await DashboardPage();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
