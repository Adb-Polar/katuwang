// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TopicRequestBrowser from "../TopicRequestBrowser";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/tutor/requests",
  useSearchParams: () => new URLSearchParams(),
}));

const openRequest = {
  id: "r1",
  subject: "MATHEMATICS",
  gradeLevel: "GRADE_8",
  note: "I keep mixing up the steps.",
  createdAt: "2026-11-17T02:00:00Z",
  topics: ["Fractions", "Ratios"],
  slots: [
    { date: "2026-12-11", day: "FRIDAY", startTime: "15:00", endTime: "16:00" },
    { date: null, day: "SATURDAY", startTime: "09:00", endTime: "10:00" },
  ],
  learner: { anonymousId: "STU-0042", image: null, gradeLevel: "GRADE_8", section: "Rizal" },
  directed: true,
};

const acceptedRequest = {
  id: "r2",
  subject: "SCIENCE",
  gradeLevel: "GRADE_8",
  status: "ACCEPTED",
  topics: ["Cells"],
  learner: { anonymousId: "STU-0043", image: null, gradeLevel: "GRADE_8", section: "Luna" },
  class: { id: "c9", nextSessionAt: null, enrolledCount: 0, maxStudents: 5 },
};

let host: HTMLDivElement, root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const tab = new URL(url, "http://localhost").searchParams.get("tab");
      const body =
        tab === "directed" ? { requests: [openRequest], total: 1 }
        : tab === "accepted" ? { requests: [acceptedRequest], total: 1 }
        : tab === "public" ? { requests: [], total: 0 }
        : { subjects: [] };
      return { ok: true, json: async () => body } as Response;
    }),
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const clickTab = async (name: string) => {
  const tab = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent?.startsWith(name))!;
  await act(async () => tab.click());
};

describe("TopicRequestBrowser", () => {
  it("shows an open request with its first topic as the title, the learner ID, times, note and accept link", async () => {
    await act(async () => root.render(h(TopicRequestBrowser)));
    expect(host.querySelector("h3 a")?.textContent).toBe("Fractions");
    expect(host.querySelector('h3 a')?.getAttribute("href")).toBe("/tutor/requests/r1");
    expect(host.textContent).toContain("Ratios");
    expect(host.textContent).toContain("Mathematics · Grade 8");
    expect(host.textContent).toContain("FromSTU-0042");
    expect(host.textContent).not.toContain("Rizal");
    expect(host.textContent).toContain("3:00–4:00 PM");
    expect(host.textContent).toContain("or every Sat 9:00–10:00 AM");
    expect(host.textContent).toContain("I keep mixing up the steps.");
    expect(host.querySelector('a[href="/tutor/requests/r1/accept"]')?.textContent).toBe("Accept & create class");
    expect(host.innerHTML).not.toMatch(/text-2xs|badge-/);
  });

  it("says plainly when a tab is empty", async () => {
    await act(async () => root.render(h(TopicRequestBrowser)));
    await clickTab("Public");
    expect(host.textContent).toContain("No public requests match your topics right now.");
  });

  it("shows accepted requests with the enrolment state and a link to the class", async () => {
    await act(async () => root.render(h(TopicRequestBrowser)));
    await clickTab("Accepted by you");
    expect(host.textContent).toContain("Waiting for the learner to enroll.");
    expect(host.textContent).toContain("0 of 5 enrolled");
    expect(host.querySelector('a[href="/tutor/classes/c9"]')?.textContent).toBe("View class");
  });
});
