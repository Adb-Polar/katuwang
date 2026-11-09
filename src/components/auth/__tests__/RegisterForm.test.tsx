// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegisterForm from "../RegisterForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe("student registration forms", () => {
  it.each(["LEARNER", "TUTOR"] as const)("requires school details for %s before submitting", async type => {
    await act(async () => root.render(<RegisterForm type={type} />));
    const id = host.querySelector<HTMLInputElement>('[name="studentIdNumber"]')!;
    const adviser = host.querySelector<HTMLInputElement>('[name="adviserTeacherName"]')!;
    expect(id.type).toBe("text"); expect(id.required).toBe(true);
    expect(id.placeholder).toBe("Enter your Student ID Number");
    expect(adviser.required).toBe(true); expect(adviser.placeholder).toBe("Enter your adviser's full name");
    // Native constraints and the shared ValidatedForm also catch whitespace.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(id, "   ");
    await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(id.getAttribute("aria-invalid")).toBe("true");
    expect(adviser.getAttribute("aria-invalid")).toBe("true");
    expect(fetch).not.toHaveBeenCalled();
  });
});
