import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { getSessionMock, redirectMock, prismaMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  redirectMock: vi.fn(),
  prismaMock: {
    user: { findUnique: vi.fn() },
    topicRequest: { count: vi.fn() },
    classSession: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getSessionMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import TutorDashboard from "@/app/tutor/page";

const tutorUser = (overrides: Record<string, unknown> = {}) => ({
  status: "ACTIVE",
  statusReason: null,
  statusExpiresAt: null,
  tutorProfile: {
    id: "tp-1",
    topicCertifications: [
      { subject: "MATHEMATICS", topic: "Fractions", status: "CERTIFIED" },
      { subject: "SCIENCE", topic: "Cells", status: "PENDING" },
    ],
    classes: [{ _count: { enrollments: 3 } }, { _count: { enrollments: 2 } }],
  },
  ...overrides,
});

describe("TutorDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1", role: "STUDENT_TUTOR", anonymousId: "TUT-0001" } });
    prismaMock.user.findUnique.mockResolvedValue(tutorUser());
    prismaMock.topicRequest.count.mockResolvedValue(4);
    prismaMock.classSession.findMany.mockResolvedValue([]);
  });

  it("renders in reading order: heading, numbers, this week", async () => {
    const html = renderToStaticMarkup(await TutorDashboard());

    const positions = [html.indexOf("Your week"), html.indexOf("5 learners enrolled"), html.indexOf("This week")];
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).toContain("4 open class requests");
    expect(html).toContain("1 certified topic, 1 pending");
    expect(html).not.toContain("text-2xs");
  });

  it("counts open requests only for the tutor's certified topics", async () => {
    await TutorDashboard();
    const where = JSON.stringify(prismaMock.topicRequest.count.mock.calls[0][0]);
    expect(where).toContain("Fractions");
    expect(where).not.toContain("Cells");
  });

  it("lists this week's sessions by day, linking to the tutor's class page", async () => {
    const week = [
      { id: "s1", topic: "Adding fractions", scheduledAt: new Date(Date.now() + 2 * 86_400_000), duration: 60, class: { id: "c1", subject: "MATHEMATICS" } },
    ];
    prismaMock.classSession.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(week);

    const html = renderToStaticMarkup(await TutorDashboard());
    expect(html).toContain("Adding fractions");
    expect(html).toContain('href="/tutor/classes/c1"');
    expect(html.match(/Next · /g)).toHaveLength(1);
  });

  it("links to Create a class when nothing is scheduled", async () => {
    const html = renderToStaticMarkup(await TutorDashboard());
    expect(html).toContain('href="/tutor/classes/new"');
  });

  it("shows the moderation notice for a suspended tutor", async () => {
    prismaMock.user.findUnique.mockResolvedValue(tutorUser({ status: "SUSPENDED", statusReason: "Spam" }));
    const html = renderToStaticMarkup(await TutorDashboard());
    expect(html).toContain("Your account is suspended");
    expect(html).toContain("Spam");
  });
});
