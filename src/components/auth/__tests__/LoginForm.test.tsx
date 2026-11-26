// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: "", signIn: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.query),
}));
vi.mock("next-auth/react", () => ({ signIn: mocks.signIn }));

import LoginForm from "../LoginForm";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mocks.query = "";
  mocks.signIn.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

const render = () => act(async () => root.render(<LoginForm />));
const contactLinks = () =>
  [...host.querySelectorAll<HTMLAnchorElement>("a")].filter((a) => a.getAttribute("href")?.startsWith("/contact"));

async function signInWithError(message: string) {
  mocks.signIn.mockResolvedValue({ error: message });
  await render();
  const set = (selector: string, value: string) => {
    const input = host.querySelector<HTMLInputElement>(selector)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  await act(async () => {
    set("#login-email", "juan@example.com");
    set("#login-password", "secret-password");
  });
  await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}

describe("LoginForm contact links", () => {
  it("always offers a way to contact an administrator", async () => {
    await render();
    expect(contactLinks().map((a) => a.getAttribute("href"))).toEqual(["/contact"]);
  });

  it("explains a forced sign-out and links to the contact form", async () => {
    mocks.query = "reason=account-inactive";
    await render();
    expect(host.textContent).toContain("You were signed out because your account is no longer active.");
    expect(contactLinks().map((a) => a.getAttribute("href"))).toContain("/contact?about=SUSPENSION_OR_BAN");
  });

  it.each([
    "Your account has been suspended. Contact an administrator for details.",
    "Your account has been banned. Contact an administrator for details.",
  ])("links to the contact form under the error: %s", async (message) => {
    await signInWithError(message);
    expect(host.textContent).toContain(message);
    expect(contactLinks().map((a) => a.getAttribute("href"))).toContain("/contact?about=SUSPENSION_OR_BAN");
  });

  it("does not add the account-status link for a wrong password", async () => {
    await signInWithError("Invalid email or password.");
    expect(contactLinks().map((a) => a.getAttribute("href"))).toEqual(["/contact"]);
  });
});
