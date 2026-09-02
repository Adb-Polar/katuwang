import { CalendarClock } from "lucide-react";
import { DerivedSlot } from "@/lib/derivedAvailability";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Read-only render of a tutor's auto-derived weekly schedule
 * (see `deriveWeeklyAvailability`). One row per weekday, one badge per window.
 */
export default function WeeklyScheduleView({
  slots,
  emptyMessage = "No upcoming sessions to build a schedule from.",
}: {
  slots: DerivedSlot[];
  emptyMessage?: string;
}) {
  if (slots.length === 0) {
    return (
      <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
        {emptyMessage}
      </p>
    );
  }

  const byDay = new Map<string, DerivedSlot[]>();
  for (const s of slots) {
    byDay.set(s.day, [...(byDay.get(s.day) ?? []), s]);
  }

  return (
    <ul className="divide-y divide-base-200">
      {Array.from(byDay.entries()).map(([day, daySlots]) => (
        <li key={day} className="flex items-start gap-3 py-2 text-xs">
          <span className="w-24 shrink-0 font-semibold text-base-content/80 flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-primary shrink-0" />
            {DAY_LABELS[day] ?? day}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {daySlots.map((s, i) => (
              <span key={i} className="badge badge-outline badge-sm text-2xs">
                {to12h(s.startTime)} &ndash; {to12h(s.endTime)}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
