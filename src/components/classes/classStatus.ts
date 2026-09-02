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
