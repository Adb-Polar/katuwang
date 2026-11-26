import { useEffect, useState } from "react";
import type { BusySession } from "@/lib/sessionTimes";

function isBusySession(value: unknown): value is BusySession {
  const s = value as Partial<BusySession> | null;
  return !!s && typeof s.id === "string" && typeof s.scheduledAt === "string" && typeof s.duration === "number" && typeof s.label === "string";
}

/**
 * The tutor's existing sessions, for flagging overlaps before a form is submitted.
 * It is a convenience only: if the request fails the list stays empty and the
 * server still rejects a real conflict on save.
 */
export function useBusySessions(): BusySession[] {
  const [sessions, setSessions] = useState<BusySession[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tutor/schedule");
        if (!res.ok) return;
        const data: unknown = await res.json();
        const list = (data as { sessions?: unknown } | null)?.sessions;
        if (!cancelled && Array.isArray(list)) setSessions(list.filter(isBusySession));
      } catch {
        /* optional data: keep the empty list */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return sessions;
}
