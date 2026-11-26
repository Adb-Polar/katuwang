// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QuizQuestionList, type QuizListItem } from "../QuizQuestionList";

const items: QuizListItem[] = [
  {
    position: 0,
    questionId: "q1",
    prompt: "2 + 2 = ?",
    options: [{ id: "o1", text: "3" }, { id: "o2", text: "4" }],
    selectedOptionId: null,
  },
];

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

async function render(submitted: boolean) {
  await act(async () => root.render(<QuizQuestionList items={items} answers={{}} onAnswer={() => {}} submitted={submitted} />));
  return host.querySelector("ol")!;
}

/** Fires the event on the question text and reports whether the list cancelled it. */
function isBlocked(list: HTMLElement, type: string) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  list.querySelector("legend")!.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("QuizQuestionList copy protection", () => {
  it.each(["copy", "cut", "contextmenu", "dragstart"])("blocks %s while the quiz is being taken", async (type) => {
    expect(isBlocked(await render(false), type)).toBe(true);
  });

  it("makes the question text unselectable while the quiz is being taken", async () => {
    expect((await render(false)).classList.contains("select-none")).toBe(true);
  });

  it("still lets the learner choose an answer", async () => {
    const list = await render(false);
    const radio = list.querySelector<HTMLInputElement>('input[type="radio"]')!;
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    radio.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });

  it.each(["copy", "contextmenu"])("allows %s again on the graded review", async (type) => {
    const list = await render(true);
    expect(isBlocked(list, type)).toBe(false);
    expect(list.classList.contains("select-none")).toBe(false);
  });
});
