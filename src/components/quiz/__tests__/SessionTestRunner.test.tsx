// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SessionTestRunner from "../SessionTestRunner";

const items = [
  {
    position: 0,
    questionId: "q1",
    prompt: "[Cells] What surrounds a plant cell?",
    selectedOptionId: "o1",
    isCorrect: true,
    explanation: "Plant cells have a rigid wall.",
    options: [
      { id: "o1", text: "Cell wall", isCorrect: true },
      { id: "o2", text: "Shell", isCorrect: false },
    ],
  },
  {
    position: 1,
    questionId: "q2",
    prompt: "Which part makes food?",
    selectedOptionId: "o3",
    isCorrect: false,
    options: [
      { id: "o3", text: "Root", isCorrect: false },
      { id: "o4", text: "Chloroplast", isCorrect: true },
    ],
  },
];

let host: HTMLDivElement, root: Root;
const render = async (attempt: object, preScore?: number) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("/session-tests")) {
        return { ok: true, json: async () => ({ sessions: [{ sessionId: "s1", pre: preScore == null ? null : { status: "SUBMITTED", scorePercent: preScore } }] }) } as Response;
      }
      return { ok: true, json: async () => attempt } as Response;
    }),
  );
  await act(async () => root.render(h(SessionTestRunner, { classId: "c1", sessionId: "s1", kind: "POST", attemptId: "a1" })));
  await act(async () => {});
};

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("SessionTestRunner (learner)", () => {
  it("shows a graded post-test with the change from the pre-test, the answers marked, and no [Topic] prefix", async () => {
    await render(
      { id: "a1", kind: "POST", title: "Cells check-in", instructions: null, status: "SUBMITTED", totalQuestions: 2, correctCount: 1, scorePercent: 50, answersRevealed: true, items },
      30,
    );
    expect(host.querySelector("h1")?.textContent).toBe("Cells check-in");
    expect(host.textContent).toContain("Up 20 points");
    expect(host.textContent).toContain("Your pre-test score was 30%.");
    expect(host.textContent).toContain("1 of 2 correct");
    expect(host.textContent).toContain("What surrounds a plant cell?");
    expect(host.textContent).not.toContain("[Cells]");
    expect(host.textContent).toContain("Correct answer");
    expect(host.textContent).toContain("Your answer");
    expect(host.innerHTML).not.toMatch(/text-2xs|radio-xs/);
  });

  it("shows the answered count and submit button while in progress", async () => {
    await render({
      id: "a1", kind: "PRE", title: "Cells check-in", instructions: "Answer what you can.", status: "IN_PROGRESS", totalQuestions: 2,
      items: items.map((i) => ({ ...i, selectedOptionId: null, isCorrect: null, explanation: null, options: i.options.map(({ id, text }) => ({ id, text })) })),
    });
    expect(host.textContent).toContain("Answer what you can.");
    expect(host.textContent).toContain("0 of 2 answered");
    expect([...host.querySelectorAll("button")].some((b) => b.textContent?.includes("Submit test"))).toBe(true);
  });
});
