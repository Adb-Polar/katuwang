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

  it("renders in reading order: heading, numbers, this week, certificates", async () => {
    const html = renderToStaticMarkup(await LearnerDashboard());

    const positions = [
      html.indexOf("Your week"),
      html.indexOf("enrolled classes"),
      html.indexOf("This week"),
      html.indexOf('data-block="certificates"'),
    ];
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toMatch(/\border-\d/);
  });

  it("groups this week's sessions by day and shows each topic in full", async () => {
    const at = (iso: string) => new Date(iso);
    const week = [
      { id: "s1", topic: "Paghubog ng Sinaunang Kabihasnan sa Asya", scheduledAt: at("2026-11-17T08:00:00Z"), duration: 60, class: { id: "c1", subject: "ARALING_PANLIPUNAN" } },
      { id: "s2", topic: "Vocabulary Development", scheduledAt: at("2026-11-18T08:00:00Z"), duration: 60, class: { id: "c2", subject: "ENGLISH" } },
      { id: "s3", topic: "Katangiang Pisikal ng Asya", scheduledAt: at("2026-11-18T09:00:00Z"), duration: 45, class: { id: "c1", subject: "ARALING_PANLIPUNAN" } },
    ];
    prismaMock.classSession.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(week);

    const html = renderToStaticMarkup(await LearnerDashboard());

    expect(html.match(/<h3/g)).toHaveLength(2);
    expect(html).toContain("Paghubog ng Sinaunang Kabihasnan sa Asya");
    expect(html).toContain("3 sessions");
    expect(html).not.toContain("text-2xs");
    expect(html.match(/Next · /g)).toHaveLength(1);
    expect(html.indexOf("Next · ")).toBeLessThan(html.indexOf("Vocabulary Development"));
  });

  it("points to Browse classes when there are no sessions at all", async () => {
    const html = renderToStaticMarkup(await LearnerDashboard());
    expect(html).toContain('href="/learner/classes"');
  });
});
