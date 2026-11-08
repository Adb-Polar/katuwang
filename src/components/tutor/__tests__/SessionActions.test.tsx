// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SessionActions from "../SessionActions";
const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
let root: Root;
let host: HTMLDivElement;
const parentSubmit = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
beforeEach(async () => {
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "s1" }) }));
  host = document.createElement("div");document.body.append(host);root = createRoot(host);
  await act(async () => root.render(h("form", { onSubmit: parentSubmit }, h(SessionActions, {
    classId: "c1", classTopics: ["QA topic"], session: {
      id: "s1", topic: "QA topic", status: "SCHEDULED", duration: 30,
      scheduledAt: new Date(Date.now() + 86400_000).toISOString(),
    },
  }))));
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Reschedule session"]')!.click());
});
afterEach(async () => { await act(async () => root.unmount());host.remove();vi.unstubAllGlobals(); });
describe("rescheduling inside the class editor", () => {
  it("renders outside the class form and submits only the session mutation", async () => {
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.closest("form")).toBeNull();
    await act(async () => dialog.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(parentSubmit).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/tutor/classes/c1/sessions/s1", expect.objectContaining({ method: "PATCH" }));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it("does not submit the class when modal validation rejects a date", async () => {
    const dialog = document.querySelector('[role="dialog"]')!;
    dialog.querySelector<HTMLInputElement>('input[type="date"]')!.value = "";
    await act(async () => dialog.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(parentSubmit).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
