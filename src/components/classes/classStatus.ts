export type ClassLifecycleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED";

export function getClassStatusBadge(
  status: ClassLifecycleStatus,
  isFull: boolean,
  activeLabel: string
): { tone: "success" | "warning" | "info" | "error"; label: string } {
  if (status === "SCHEDULED") {
    return isFull ? { tone: "warning", label: "Full" } : { tone: "success", label: activeLabel };
  }
  if (status === "COMPLETED") return { tone: "info", label: "Completed" };
  if (status === "SUSPENDED") return { tone: "error", label: "Suspended" };
  return { tone: "error", label: "Cancelled" };
}
