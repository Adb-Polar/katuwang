export type ClassLifecycleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";

export function getClassStatusBadge(
  status: ClassLifecycleStatus,
  isFull: boolean,
  activeLabel: string
): { tone: "success" | "warning" | "info" | "error" | "neutral"; label: string } {
  if (status === "SCHEDULED") {
    return isFull ? { tone: "warning", label: "Full" } : { tone: "success", label: activeLabel };
  }
  if (status === "COMPLETED") return { tone: "info", label: "Completed" };
  if (status === "SUSPENDED") return { tone: "error", label: "Suspended" };
  if (status === "BANNED") return { tone: "error", label: "Banned" };
  return { tone: "error", label: "Cancelled" };
}

export type SessionLifecycleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export function getSessionStatusBadge(
  status: SessionLifecycleStatus
): { tone: "success" | "info" | "error"; label: string } {
  if (status === "SCHEDULED") return { tone: "success", label: "Scheduled" };
  if (status === "COMPLETED") return { tone: "info", label: "Completed" };
  return { tone: "error", label: "Cancelled" };
}

/** ISO time of the next upcoming scheduled session, else the most recent one, else null. */
export function nextSessionAt(
  sessions: { scheduledAt: Date | string; status: SessionLifecycleStatus }[],
  now: Date = new Date(),
): string | null {
  const iso = (d: Date | string) => new Date(d).toISOString();
  const upcoming = sessions
    .filter((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  if (upcoming) return iso(upcoming.scheduledAt);
  const latest = [...sessions].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
  return latest ? iso(latest.scheduledAt) : null;
}
