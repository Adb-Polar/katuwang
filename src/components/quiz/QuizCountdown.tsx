"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { formatCountdown } from "@/lib/attemptDeadline";

const WARNING_MS = 60_000;

/**
 * Time left on a timed quiz. Counts down to the server's deadline (so a refresh cannot
 * reset it) and calls `onExpire` once when it reaches zero.
 */
export default function QuizCountdown({ deadlineAt, onExpire }: { deadlineAt: string; onExpire: () => void }) {
  const deadline = new Date(deadlineAt).getTime();
  const [remaining, setRemaining] = useState(() => deadline - Date.now());
  const expire = useRef(onExpire);
  const fired = useRef(false);

  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0 && !fired.current) {
        fired.current = true;
        expire.current();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const urgent = remaining <= WARNING_MS;

  return (
    <div
      role="timer"
      aria-label="Time left"
      className={`kt-alert ${urgent ? "kt-alert--warning" : "kt-alert--info"} sticky top-2 z-10 items-center! text-sm`}
    >
      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Time left: <span className="font-semibold tabular-nums">{formatCountdown(remaining)}</span>
      </span>
      {/* Announced once, not every second. */}
      <span className="sr-only" aria-live="assertive">
        {remaining <= 0 ? "Time is up. Submitting your answers." : urgent ? "One minute left." : ""}
      </span>
    </div>
  );
}
