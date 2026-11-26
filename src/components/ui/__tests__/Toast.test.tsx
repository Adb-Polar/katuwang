// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "../Toast";

const navigation = vi.hoisted(() => ({ pathname: "/tutor/classes/new" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Trigger({ message, awaitNavigation }: { message: string; awaitNavigation?: boolean }) {
  const toast = useToast();
  return <button onClick={() => toast(message, "success", { awaitNavigation })}>go</button>;
}

describe("ToastProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    navigation.pathname = "/tutor/classes/new";
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const click = () => act(() => container.querySelector("button")!.click());
  const statuses = () => Array.from(container.querySelectorAll('[role="status"]')).map((node) => node.textContent);

  it("shows the confirmation message", () => {
    act(() => root.render(<ToastProvider><Trigger message="Class created." /></ToastProvider>));
    click();
    expect(statuses()).toEqual(["Class created."]);
  });

  it("removes the toast after its display time", () => {
    act(() => root.render(<ToastProvider><Trigger message="Session added." /></ToastProvider>));
    click();
    act(() => vi.advanceTimersByTime(5000));
    expect(statuses()).toEqual([]);
  });

  it("keeps only the three most recent toasts", () => {
    act(() => root.render(<ToastProvider><Trigger message="Saved." /></ToastProvider>));
    for (let i = 0; i < 5; i++) click();
    expect(statuses()).toHaveLength(3);
  });

  it("can be dismissed by the user", () => {
    act(() => root.render(<ToastProvider><Trigger message="Saved." /></ToastProvider>));
    click();
    act(() => container.querySelector<HTMLButtonElement>('button[aria-label="Dismiss"]')!.click());
    expect(statuses()).toEqual([]);
  });

  it("keeps a toast raised before a redirect until the new page has shown it", () => {
    const tree = () => <ToastProvider><Trigger message="Class created." awaitNavigation /></ToastProvider>;
    act(() => root.render(tree()));
    click();
    // A slow navigation must not use up the display time.
    act(() => vi.advanceTimersByTime(8000));
    expect(statuses()).toEqual(["Class created."]);
    navigation.pathname = "/tutor/classes/c1";
    act(() => root.render(tree()));
    act(() => vi.advanceTimersByTime(4000));
    expect(statuses()).toEqual(["Class created."]);
    act(() => vi.advanceTimersByTime(1000));
    expect(statuses()).toEqual([]);
  });

  it("drops a toast whose redirect never happens", () => {
    act(() => root.render(<ToastProvider><Trigger message="Class created." awaitNavigation /></ToastProvider>));
    click();
    act(() => vi.advanceTimersByTime(15000));
    expect(statuses()).toEqual([]);
  });

  it("does nothing when no provider is mounted", () => {
    act(() => root.render(<Trigger message="Saved." />));
    expect(click).not.toThrow();
    expect(statuses()).toEqual([]);
  });
});
