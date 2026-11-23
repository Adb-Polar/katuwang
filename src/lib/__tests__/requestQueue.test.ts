import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BoundedQueue,
  QueueOverloadedError,
  busyResponse,
  laneOptions,
  runQueued,
  withQueue,
} from "@/lib/requestQueue";

/** A task whose completion the test controls. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("BoundedQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the task result", async () => {
    const queue = new BoundedQueue({ concurrency: 1, maxQueued: 1, timeoutMs: 1000 });
    await expect(queue.run(async () => "done")).resolves.toBe("done");
  });

  it("never runs more than `concurrency` tasks at once", async () => {
    const queue = new BoundedQueue({ concurrency: 2, maxQueued: 10, timeoutMs: 1000 });
    const gates = [deferred(), deferred(), deferred()];
    const runs = gates.map((gate) => queue.run(() => gate.promise));

    expect(queue.stats()).toMatchObject({ running: 2, queued: 1 });

    gates.forEach((gate) => gate.resolve());
    await Promise.all(runs);
  });

  it("starts waiting tasks in arrival order", async () => {
    const queue = new BoundedQueue({ concurrency: 1, maxQueued: 10, timeoutMs: 1000 });
    const first = deferred();
    const started: string[] = [];

    const runs = [
      queue.run(() => first.promise),
      queue.run(async () => void started.push("second")),
      queue.run(async () => void started.push("third")),
    ];
    first.resolve();
    await Promise.all(runs);

    expect(started).toEqual(["second", "third"]);
  });

  it("rejects immediately once the waiting line is full", async () => {
    const queue = new BoundedQueue({ concurrency: 1, maxQueued: 1, timeoutMs: 1000 });
    const gate = deferred();
    const running = queue.run(() => gate.promise);
    const waiting = queue.run(async () => undefined);

    await expect(queue.run(async () => undefined)).rejects.toMatchObject({ reason: "full" });

    gate.resolve();
    await Promise.all([running, waiting]);
  });

  it("rejects a task that waits longer than the timeout and never runs it", async () => {
    const queue = new BoundedQueue({ concurrency: 1, maxQueued: 5, timeoutMs: 1000 });
    const gate = deferred();
    const running = queue.run(() => gate.promise);
    const task = vi.fn(async () => undefined);
    const waiting = queue.run(task);
    const rejection = expect(waiting).rejects.toMatchObject({ reason: "timeout" });

    await vi.advanceTimersByTimeAsync(1000);
    await rejection;
    gate.resolve();
    await running;

    expect(task).not.toHaveBeenCalled();
    expect(queue.stats()).toMatchObject({ running: 0, queued: 0, rejected: 1 });
  });

  it("frees the slot when a task throws", async () => {
    const queue = new BoundedQueue({ concurrency: 1, maxQueued: 0, timeoutMs: 1000 });

    await expect(queue.run(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");

    await expect(queue.run(async () => "next")).resolves.toBe("next");
  });

  it("tells rejected callers to retry after at least one second", async () => {
    const queue = new BoundedQueue({ concurrency: 1, maxQueued: 0, timeoutMs: 100 });
    const gate = deferred();
    const running = queue.run(() => gate.promise);

    await expect(queue.run(async () => undefined)).rejects.toMatchObject({ retryAfter: 1 });

    gate.resolve();
    await running;
  });
});

describe("laneOptions", () => {
  it("uses the lane defaults when no override is set", () => {
    expect(laneOptions("password", {})).toEqual({ concurrency: 2, maxQueued: 40, timeoutMs: 15_000 });
  });

  it("applies env overrides", () => {
    const env = { QUEUE_READ_CONCURRENCY: "3", QUEUE_READ_MAX_QUEUED: "7", QUEUE_READ_TIMEOUT_MS: "500" };
    expect(laneOptions("read", env)).toEqual({ concurrency: 3, maxQueued: 7, timeoutMs: 500 });
  });

  it.each(["0", "-1", "abc", "1.5", ""])("ignores the invalid override %j", (raw) => {
    expect(laneOptions("report", { QUEUE_REPORT_CONCURRENCY: raw }).concurrency).toBe(2);
  });
});

describe("runQueued", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runs the task directly when QUEUE_DISABLED=1", async () => {
    vi.stubEnv("QUEUE_DISABLED", "1");
    await expect(runQueued("report", async () => 42)).resolves.toBe(42);
  });
});

describe("busyResponse", () => {
  it("turns a queue rejection into a 503 with Retry-After", async () => {
    const response = busyResponse(new QueueOverloadedError("full", 7));

    expect(response?.status).toBe(503);
    expect(response?.headers.get("Retry-After")).toBe("7");
    await expect(response?.json()).resolves.toEqual({
      error: "The server is busy right now. Please try again in a moment.",
    });
  });

  it("returns null for any other error", () => {
    expect(busyResponse(new Error("boom"))).toBeNull();
  });
});

describe("withQueue", () => {
  it("passes the handler's response through", async () => {
    const handler = withQueue("read", async (name: string) => Response.json({ name }));

    const response = await handler("ok");

    await expect(response.json()).resolves.toEqual({ name: "ok" });
  });

  it("answers 503 when the handler hits a queue rejection", async () => {
    const handler = withQueue("read", async () => {
      throw new QueueOverloadedError("timeout", 5);
    });

    const response = await handler();

    expect(response.status).toBe(503);
  });

  it("rethrows errors that are not queue rejections", async () => {
    const handler = withQueue("read", async () => {
      throw new Error("boom");
    });

    await expect(handler()).rejects.toThrow("boom");
  });
});
