// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OtherTopicAssessment from "../OtherTopicAssessment";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/useSubjectCatalog", () => ({ useSubjectCatalog: () => ({ subjects: [{ slug: "MATH", name: "Mathematics", topics: ["Geometry"] }], topicsFor: () => ["Geometry"], loading: false, error: null, retry: vi.fn() }) }));
let host: HTMLDivElement, root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(h(OtherTopicAssessment)));
  for (const [value, needle] of [["MATH", 'option[value="MATH"]'], ["Geometry", 'option[value="Geometry"]']]) {
    const select = host.querySelector(needle)!.closest("select")!;
    await act(async () => { select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); });
  }
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
describe("assessment readiness feedback", () => {
  it("explains pending qualified review even when the topic already contains questions", async () => {
    const error = "This topic does not have enough reviewed qualification questions. Ask an admin to arrange qualified topic review. Demo and unreviewed questions cannot grant certification.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: "BANK_NOT_READY", error }) }));
    await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(host.textContent).toContain(error);
    expect(host.textContent).not.toContain("ask an admin to add some");
  });
  it("still explains review when an older endpoint omits its error text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: "BANK_NOT_READY" }) }));
    await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(host.textContent).toContain("question approval");
  });
});
