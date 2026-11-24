import { useFetchList } from "./useFetchList";
import type { BusySlot } from "@/lib/sessionTime";

/** The signed-in tutor's upcoming booked sessions (see `/api/tutor/sessions/busy`). */
export function useBusySlots(): BusySlot[] {
  return useFetchList<BusySlot>("/api/tutor/sessions/busy", "Could not load your schedule.").data;
}
