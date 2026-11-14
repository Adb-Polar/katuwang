// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdministrativeBankApproval from "../AdministrativeBankApproval";
let host: HTMLDivElement, root: Root;
const saved = vi.fn();
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); saved.mockReset();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ approvedQuestions: 5840 }) }));
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(h(AdministrativeBankApproval, { onApproved: saved })));
  await act(async () => host.querySelector("button")!.click());
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
describe("explicit administrator authorization", () => {
  it("requires a reason and administrator confirmation before submitting", async () => {
    const form = document.querySelector('[role="dialog"] form') as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
    await act(async () => form.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    expect(fetch).not.toHaveBeenCalled(); expect(saved).not.toHaveBeenCalled();
  });
  it("records administrative authorization without academic-review attestations", async () => {
    const reason = "The application owner approves these questions for tutor assessments.";
    const textarea = document.querySelector("textarea")!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, reason); textarea.dispatchEvent(new Event("input", { bubbles: true })); });
    await act(async () => document.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    const form = document.querySelector('[role="dialog"] form')!;
    await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(fetch).toHaveBeenCalledOnce();
    const request = vi.mocked(fetch).mock.calls[0][1]!;
    expect(JSON.parse(request.body as string)).toEqual({ reason, administrativeApproval: true });
    expect(saved).toHaveBeenCalledWith(5840);
  });
});
