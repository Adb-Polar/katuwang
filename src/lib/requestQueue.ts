import { NextResponse } from "next/server";

/**
 * Bounded in-process work queue (load shedding for a single Node instance).
 *
 * Each lane runs at most `concurrency` tasks at once and parks up to
 * `maxQueued` more in FIFO order. Anything beyond that — or anything that waits
 * longer than `timeoutMs` — is rejected with `QueueOverloadedError`, which
 * routes turn into `503` + `Retry-After`. The bound is the point: an unbounded
 * queue only moves the memory blow-up, it does not prevent it.
 *
 * Per-process only, like `rateLimit.ts`: each instance keeps its own lanes.
 */

export type QueueLane = "password" | "report" | "read";

export interface QueueOptions {
  /** Tasks allowed to run at the same time. */
  concurrency: number;
  /** Tasks allowed to wait; one more than this is rejected immediately. */
  maxQueued: number;
  /** Longest a task may wait for a slot before it is rejected. */
  timeoutMs: number;
}

export interface QueueStats {
  running: number;
  queued: number;
  concurrency: number;
  maxQueued: number;
  /** Tasks rejected since the process started (queue full or wait timed out). */
  rejected: number;
}

export type QueueOverloadReason = "full" | "timeout";

export class QueueOverloadedError extends Error {
  constructor(
    readonly reason: QueueOverloadReason,
    /** Seconds the caller should wait before retrying. */
    readonly retryAfter: number
  ) {
    super(reason === "full" ? "Queue is full." : "Timed out waiting in queue.");
    this.name = "QueueOverloadedError";
  }
}

interface Waiter {
  start: () => void;
  timer: ReturnType<typeof setTimeout>;
}

export class BoundedQueue {
  private running = 0;
  private rejected = 0;
  private readonly waiters: Waiter[] = [];

  constructor(private readonly options: QueueOptions) {}

  /** Runs `task` once a slot is free; rejects with `QueueOverloadedError` when overloaded. */
  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  stats(): QueueStats {
    return {
      running: this.running,
      queued: this.waiters.length,
      concurrency: this.options.concurrency,
      maxQueued: this.options.maxQueued,
      rejected: this.rejected,
    };
  }

  private acquire(): Promise<void> {
    if (this.running < this.options.concurrency) {
      this.running += 1;
      return Promise.resolve();
    }
    if (this.waiters.length >= this.options.maxQueued) {
      return Promise.reject(this.overloaded("full"));
    }
    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        start: resolve,
        timer: setTimeout(() => {
          const index = this.waiters.indexOf(waiter);
          if (index !== -1) this.waiters.splice(index, 1);
          reject(this.overloaded("timeout"));
        }, this.options.timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  /** Hands the freed slot straight to the next waiter so `running` never dips. */
  private release(): void {
    const next = this.waiters.shift();
    if (!next) {
      this.running -= 1;
      return;
    }
    clearTimeout(next.timer);
    next.start();
  }

  private overloaded(reason: QueueOverloadReason): QueueOverloadedError {
    this.rejected += 1;
    return new QueueOverloadedError(reason, Math.max(1, Math.ceil(this.options.timeoutMs / 2000)));
  }
}

/**
 * Lane defaults, sized for one small instance (Render free / a 2-CPU VM):
 * - `password`: bcryptjs is pure JS on the main thread, so more than a couple
 *   at once just starves every other request.
 * - `report`: PDF/CSV generation — CPU plus several large queries.
 * - `read`: the unauthenticated-scale list/search endpoints; kept below the
 *   DB pool size so they cannot take every connection.
 */
const LANE_DEFAULTS: Record<QueueLane, QueueOptions> = {
  password: { concurrency: 2, maxQueued: 40, timeoutMs: 15_000 },
  report: { concurrency: 2, maxQueued: 10, timeoutMs: 20_000 },
  read: { concurrency: 8, maxQueued: 100, timeoutMs: 10_000 },
};

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/** `QUEUE_<LANE>_CONCURRENCY` / `_MAX_QUEUED` / `_TIMEOUT_MS` override the defaults. */
export function laneOptions(lane: QueueLane, env: Record<string, string | undefined> = process.env): QueueOptions {
  const defaults = LANE_DEFAULTS[lane];
  const prefix = `QUEUE_${lane.toUpperCase()}`;
  return {
    concurrency: positiveInt(env[`${prefix}_CONCURRENCY`], defaults.concurrency),
    maxQueued: positiveInt(env[`${prefix}_MAX_QUEUED`], defaults.maxQueued),
    timeoutMs: positiveInt(env[`${prefix}_TIMEOUT_MS`], defaults.timeoutMs),
  };
}

// Lanes live on `globalThis` so dev hot reloads don't orphan in-flight counters.
const globalForQueue = globalThis as unknown as {
  requestQueueLanes: Map<QueueLane, BoundedQueue> | undefined;
};

function getLane(lane: QueueLane): BoundedQueue {
  const lanes = (globalForQueue.requestQueueLanes ??= new Map());
  let queue = lanes.get(lane);
  if (!queue) {
    queue = new BoundedQueue(laneOptions(lane));
    lanes.set(lane, queue);
  }
  return queue;
}

/** `QUEUE_DISABLED=1` bypasses every lane (local debugging / emergency switch). */
export function queueEnabled(): boolean {
  return process.env.QUEUE_DISABLED !== "1";
}

/** Runs `task` in `lane`, waiting for a slot; throws `QueueOverloadedError` when overloaded. */
export function runQueued<T>(lane: QueueLane, task: () => Promise<T>): Promise<T> {
  return queueEnabled() ? getLane(lane).run(task) : task();
}

/** Live counters for every lane, for the health endpoint. */
export function queueStats(): Record<QueueLane, QueueStats> {
  return {
    password: getLane("password").stats(),
    report: getLane("report").stats(),
    read: getLane("read").stats(),
  };
}

/** Standard 503 response with a `Retry-After` header. */
export function serverBusy(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "The server is busy right now. Please try again in a moment." },
    { status: 503, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * For a route's `catch` block: the 503 for a queue rejection thrown deeper in
 * the call stack (e.g. by `hashPassword`), or `null` for any other error.
 */
export function busyResponse(error: unknown): NextResponse | null {
  return error instanceof QueueOverloadedError ? serverBusy(error.retryAfter) : null;
}

/** Wraps a route handler so the whole request waits its turn in `lane`. */
export function withQueue<Args extends unknown[]>(
  lane: QueueLane,
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await runQueued(lane, () => handler(...args));
    } catch (error) {
      const busy = busyResponse(error);
      if (busy) return busy;
      throw error;
    }
  };
}
