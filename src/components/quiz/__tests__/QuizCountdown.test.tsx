// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuizCountdown from "../QuizCountdown";

const NOW = new Date("2026-12-01T01:00:00.000Z");
const inSeconds = (seconds: number) => new Date(NOW.getTime() + seconds * 1000).toISOString();

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

const timer = () => host.querySelector('[role="timer"]')!;
const render = (deadlineAt: string, onExpire = vi.fn()) => {
  act(() => root.render(<QuizCountdown deadlineAt={deadlineAt} onExpire={onExpire} />));
  return onExpire;
};

describe("QuizCountdown", () => {
  it("shows the time left until the deadline and counts down", () => {
    render(inSeconds(125));
    expect(timer().textContent).toContain("2:05");
    act(() => vi.advanceTimersByTime(5000));
    expect(timer().textContent).toContain("2:00");
  });

  it("turns to a warning in the last minute", () => {
    render(inSeconds(61));
    expect(timer().className).toContain("kt-alert--info");
    act(() => vi.advanceTimersByTime(1000));
    expect(timer().className).toContain("kt-alert--warning");
    expect(timer().textContent).toContain("One minute left.");
  });

  it("calls onExpire exactly once when time runs out", () => {
    const onExpire = render(inSeconds(3));
    act(() => vi.advanceTimersByTime(2000));
    expect(onExpire).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onExpire).toHaveBeenCalledOnce();
    expect(timer().textContent).toContain("0:00");
  });

  it("expires straight away when the page is opened after the deadline", () => {
    const onExpire = render(inSeconds(-30));
    expect(onExpire).toHaveBeenCalledOnce();
    expect(timer().textContent).toContain("0:00");
  });

  it("stops ticking after it is removed", () => {
    const onExpire = render(inSeconds(3));
    act(() => root.render(<div />));
    act(() => vi.advanceTimersByTime(10_000));
    expect(onExpire).not.toHaveBeenCalled();
  });
});
