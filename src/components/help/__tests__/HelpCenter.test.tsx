// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import HelpCenter from "../HelpCenter";
import { HELP_CONTENT } from "@/lib/help/helpContent";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function render(chatAvailable = false) {
  const host = document.createElement("div");
  act(() => createRoot(host).render(<HelpCenter role="TUTOR" chatAvailable={chatAvailable} />));
  return host;
}

function search(host: HTMLElement, text: string) {
  const input = host.querySelector<HTMLInputElement>('input[type="search"]')!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("HelpCenter", () => {
  it("lists every guide and question for the role", () => {
    const host = render();
    expect(host.querySelectorAll("details").length).toBe(HELP_CONTENT.TUTOR.guides.length + HELP_CONTENT.TUTOR.faqs.length);
  });

  it("searches guide steps as well as questions, opening the matches", () => {
    const host = render();
    search(host, "attendance");
    const open = [...host.querySelectorAll("details")].filter((d) => d.open);
    expect(open.map((d) => d.querySelector("summary")!.textContent)).toEqual(["Manage your roster"]);
  });

  it("only mentions the chat helper when the chatbot is on", () => {
    expect(render(false).textContent).not.toContain("chat helper");
    expect(render(true).textContent).toContain("chat helper");
  });

  it("never shows status codes or setting keys in the help text", () => {
    const text = JSON.stringify(HELP_CONTENT);
    expect(text).not.toMatch(/\b(PENDING|CERTIFIED|OPEN|ACCEPTED|ENROLLED|SCHEDULED|BANK_NOT_READY)\b|showTutorRealNames|chatbotEnabled/);
  });
});
