// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordForm from "../ForgotPasswordForm";
import ResetPasswordForm from "../ResetPasswordForm";

const mocks = vi.hoisted(() => ({ push: vi.fn(), fetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }), useSearchParams: () => new URLSearchParams() }));
let root: Root;
let host: HTMLDivElement;
const response = (body: unknown, status = 200) => ({ ok: status === 200, status, json: async () => body, headers: new Headers() });
const submit = () => act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
const fill = (input: HTMLInputElement, value: string) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); vi.stubGlobal("fetch", mocks.fetch);
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.history.replaceState(null, "", "/forgot-password");
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove();
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe("forgot password screens", () => {
  it("requests an OTP, shows verification errors, and goes directly to the password screen after verification", async () => {
    mocks.fetch.mockResolvedValueOnce(response({ message: "Check your inbox for a verification code." }))
      .mockResolvedValueOnce(response({ error: "Invalid or expired verification. Request a new code." }, 400))
      .mockResolvedValueOnce(response({ verified: true }));
    await act(async () => root.render(<ForgotPasswordForm />));
    await fill(host.querySelector("input")!, "primary@example.test"); await submit();
    expect(host.textContent).toContain("Verify code");
    expect(host.textContent).not.toContain("Choose recovery method");
    await fill(host.querySelector("input")!, "11111111"); await submit();
    expect(host.textContent).toContain("Invalid or expired verification"); expect(mocks.push).not.toHaveBeenCalled();
    await fill(host.querySelector("input")!, "12345678"); await submit();
    expect(mocks.push).toHaveBeenCalledWith("/reset-password");
    expect(mocks.fetch.mock.calls.map(([url, init]) => [url, JSON.parse(init.body)])).toEqual([
      ["/api/auth/forgot-password", { email: "primary@example.test", method: "primary" }],
      ["/api/auth/recovery", { action: "verify", code: "11111111" }],
      ["/api/auth/recovery", { action: "verify", code: "12345678" }],
    ]);
  });

  it("uses the server authorization without a URL token, requires matching passwords, and returns to login after success", async () => {
    mocks.fetch.mockResolvedValueOnce(response({ valid: true })).mockResolvedValueOnce(response({ message: "Password changed" }));
    await act(async () => root.render(<ResetPasswordForm />));
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({});
    const inputs = host.querySelectorAll("input");
    await fill(inputs[0], "NewPassword!2026"); await fill(inputs[1], "DifferentPassword!2026"); await submit();
    expect(host.textContent).toContain("Passwords do not match."); expect(mocks.fetch).toHaveBeenCalledTimes(1);
    await fill(inputs[1], "NewPassword!2026"); await submit();
    expect(JSON.parse(mocks.fetch.mock.calls[1][1].body)).toEqual({ password: "NewPassword!2026", confirmPassword: "NewPassword!2026" });
    expect(host.textContent).toContain("Password updated");
    await act(async () => vi.advanceTimersByTime(2000));
    expect(mocks.push).toHaveBeenCalledWith("/login?reset=true");
  });

  it("does not display the password form when server authorization is absent or expired", async () => {
    mocks.fetch.mockResolvedValue(response({ error: "Invalid authorization" }, 400));
    await act(async () => root.render(<ResetPasswordForm />));
    expect(host.querySelector("form")).toBeNull(); expect(host.textContent).toContain("Request a new code");
  });

  it("still accepts a previously issued reset-link token and removes it from browser history", async () => {
    const token = "a".repeat(64);
    window.history.replaceState(null, "", `/reset-password#token=${token}`);
    mocks.fetch.mockResolvedValue(response({ valid: true }));
    await act(async () => root.render(<ResetPasswordForm />));
    expect(window.location.hash).toBe(""); expect(host.querySelector("form")).not.toBeNull();
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ token });
  });
});
