import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { getSessionMock, redirectMock, prismaMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  redirectMock: vi.fn(),
  prismaMock: {
    classEnrollment: { count: vi.fn() },
    topicRequest: { count: vi.fn() },
    classSession: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getSessionMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/components/certificates/CertificateList", () => ({
  default: () => <section data-block="certificates" />,
}));
vi.mock("@/components/schedule/WeeklyTimetable", () => ({
  default: () => <div data-block="timetable" />,
}));

import LearnerDashboard from "@/app/learner/page";

const LEARNER_ID = "learner-1";

describe("LearnerDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: LEARNER_ID, role: "STUDENT_LEARNER" } });
    prismaMock.classEnrollment.count.mockResolvedValue(2);
    prismaMock.topicRequest.count.mockResolvedValue(1);
    prismaMock.classSession.findMany.mockResolvedValue([]);
  });

  it("counts only enrolments that have not been withdrawn", async () => {
    await LearnerDashboard();

    expect(prismaMock.classEnrollment.count).toHaveBeenCalledWith({
      where: { learnerId: LEARNER_ID, withdrawnAt: null },
    });
  });

  it("renders the blocks in reading order: upcoming, stats, this week, certificates", async () => {
    const html = renderToStaticMarkup(await LearnerDashboard());

    const positions = [
      html.indexOf("Upcoming sessions"),
      html.indexOf("Enrolled classes"),
      html.indexOf("This week"),
      html.indexOf('data-block="certificates"'),
    ];
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toMatch(/\border-\d/);
  });
});
