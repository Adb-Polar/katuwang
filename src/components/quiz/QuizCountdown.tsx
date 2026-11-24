"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";

const TICK_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const LOW_TIME_SECONDS = 60;

const pad = (n: number) => String(n).padStart(2, "0");

/** `mm:ss`, or `h:mm:ss` past an hour. */
function formatRemaining(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * SECONDS_PER_MINUTE));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE) % SECONDS_PER_MINUTE;
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Live countdown to a timed attempt's deadline. Calls `onExpire` exactly once
 * when the time runs out so the runner can auto-submit.
 */
export default function QuizCountdown({ deadlineAt, onExpire }: { deadlineAt: string; onExpire: () => void }) {
  const deadlineMs = new Date(deadlineAt).getTime();
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Always call the latest handler — it closes over the runner's current answers.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let expired = false;
    const tick = () => {
      const now = Date.now();
      setNowMs(now);
      if (!expired && now >= deadlineMs) {
        expired = true;
        clearInterval(interval);
        onExpireRef.current();
      }
    };
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, [deadlineMs]);

  const remainingSeconds = Math.max(0, Math.ceil((deadlineMs - nowMs) / TICK_MS));
  const isLow = remainingSeconds <= LOW_TIME_SECONDS;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-semibold ${
        isLow ? "border-error/40 bg-error/10 text-error" : "border-base-300 bg-base-200 text-base-content"
      }`}
      role="timer"
      aria-label={`Time remaining: ${formatRemaining(remainingSeconds)}`}
    >
      <Timer className="h-3.5 w-3.5" aria-hidden="true" />
      {formatRemaining(remainingSeconds)}
    </span>
  );
}
