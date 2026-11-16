// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TutorBrowser from "../TutorBrowser";

const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/hooks/usePaginatedList", () => ({ usePaginatedList: list }));
vi.mock("@/hooks/useSubjectCatalog", () => ({
  useSubjectCatalog: () => ({ subjects: [], loading: false, error: null, retry: vi.fn() }),
}));
let host: HTMLDivElement, root: Root;
const tutor = {
  id: "t1", anonymousId: "TUT-0140", subjects: ["MATH"],
  verifiedTopics: [{ subject: "MATH", topic: "Fractions" }],
  verifiedTopicCount: 1, verifiedClasses: [], publishedClassCount: 1, nextSessionAt: null,
};
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  list.mockReturnValue({ data: [tutor], meta: {}, total: 1, page: 1, pageSize: 10, loading: false });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

it("shows the certified topic badge even when no published class has a verified topic", async () => {
  await act(async () => root.render(h(TutorBrowser)));
  const chip = host.querySelector('[aria-label="Certified topics"] [title="Fractions"]');
  expect(chip?.textContent).toBe("Fractions");
  expect(chip?.className).toContain("text-success");
  expect(chip?.querySelector("svg")).not.toBeNull();
  expect(host.textContent).toContain("1 verified topic");
});

it("limits topic badges and shows the number of additional certifications", async () => {
  const verifiedTopics = Array.from({ length: 9 }, (_, i) => ({ subject: "MATH", topic: `Topic ${i}` }));
  list.mockReturnValue({ ...list(), data: [{ ...tutor, verifiedTopics, verifiedTopicCount: 9 }] });
  await act(async () => root.render(h(TutorBrowser)));
  const badges = host.querySelector('[aria-label="Certified topics"]')!;
  expect(badges.querySelectorAll("[title]")).toHaveLength(3);
  expect(badges.textContent).toContain("+6 more");
  expect(host.querySelector('a[href="/learner/tutors/t1"]')).not.toBeNull();
});
