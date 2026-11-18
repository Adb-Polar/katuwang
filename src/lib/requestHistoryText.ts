/** Plain-language text for a class request's history (`TopicRequestHistory` before/after snapshots). */

type SnapshotSlot = { day: string; startTime: string; endTime: string };
export type RequestSnapshot = {
  status?: string;
  note?: string | null;
  topics?: string[];
  slots?: SnapshotSlot[];
  expiresAt?: string;
  /** Snapshots also hold internal IDs (learner, tutor profile, class), which are never displayed. */
  [key: string]: unknown;
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  OPEN: "Waiting for a tutor",
  ACCEPTED: "Class created",
  ENROLLED: "Learner enrolled",
  FULFILLED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const EVENT_TITLE: Record<string, string> = {
  CREATED: "Request posted",
  RESUBMITTED: "Request renewed",
  SLOTS_CHANGED: "Free times changed",
  NOTE_CHANGED: "Note changed",
  DETAILS_CHANGED: "Request edited",
  EXPIRED: "Request expired",
  IMPORTED_BASELINE: "Earlier history not available",
};

/** "Request posted", or for a status change the new status ("Class created", "Cancelled", …). */
export function eventTitle(eventType: string, after: RequestSnapshot | null): string {
  if (eventType === "STATUS_CHANGED" && after?.status) {
    return REQUEST_STATUS_LABEL[after.status] ?? "Status changed";
  }
  return EVENT_TITLE[eventType] ?? "Request updated";
}

/** "15:00" → "3:00 PM" */
function clock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "Fri 3:00 PM–4:00 PM" — snapshots keep only the weekday, not the date. */
export function snapshotSlotLabel(slot: SnapshotSlot): string {
  const day = slot.day[0] + slot.day.slice(1, 3).toLowerCase();
  return `${day} ${clock(slot.startTime)}–${clock(slot.endTime)}`;
}

const list = (items: string[] | undefined) => (items && items.length > 0 ? items.join(", ") : "none");
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * What a learner, tutor or admin would want to know changed, one line each. Internal IDs in the
 * snapshot (learner, tutor profile, class) are deliberately never shown.
 */
export function changeLines(before: RequestSnapshot | null, after: RequestSnapshot | null): string[] {
  if (!before || !after) return [];
  const lines: string[] = [];
  if (!same(before.topics, after.topics)) lines.push(`Topics: ${list(before.topics)} → ${list(after.topics)}`);
  if (!same(before.slots, after.slots)) {
    lines.push(`Free times: ${list(before.slots?.map(snapshotSlotLabel))} → ${list(after.slots?.map(snapshotSlotLabel))}`);
  }
  if (!same(before.note, after.note)) lines.push(after.note ? `Note: “${after.note}”` : "Note removed");
  return lines;
}
