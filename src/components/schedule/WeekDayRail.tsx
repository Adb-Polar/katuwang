import Link from "next/link";
import { addDays, formatDayMonth, formatTime, formatWeekday } from "@/lib/datetime";
import { scheduleDate } from "@/lib/scheduleDates";
import { subjectDisplayLabel } from "@/lib/displayLabels";

export type RailSession = {
  id: string;
  topic: string;
  scheduledAt: Date;
  duration: number;
  class: { id: string; subject: string };
};

export type DayGroup = { key: string; sessions: RailSession[] };

/** Groups sessions (already in time order) by school-calendar day. */
export function groupByDay(sessions: RailSession[]): DayGroup[] {
  const days: DayGroup[] = [];
  for (const s of sessions) {
    const key = scheduleDate(s.scheduledAt);
    let day = days.find((d) => d.key === key);
    if (!day) {
      day = { key, sessions: [] };
      days.push(day);
    }
    day.sessions.push(s);
  }
  return days;
}

/** "in 45 min", "in 3 h", "tomorrow", or the weekday — how far away the next session is. */
function startsIn(at: Date, now: Date, isTomorrow: boolean): string {
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (minutes < 60) return `in ${Math.max(minutes, 1)} min`;
  if (minutes < 12 * 60) return `in ${Math.round(minutes / 60)} h`;
  return isTomorrow ? "tomorrow" : `on ${formatWeekday(at)}`;
}

/**
 * The dashboard week as a calendar rail (learner and tutor): a date column per day (big serif day
 * number, Today in brand blue) and that day's sessions on a thin timeline. The very next session
 * gets a filled dot and a "Next" pill so the list answers "what's my next class?" at a glance.
 */
export default function WeekDayRail({
  days,
  now,
  hrefFor,
}: {
  days: DayGroup[];
  now: Date;
  /** Where a session row links: the class page in the viewer's portal. */
  hrefFor: (classId: string) => string;
}) {
  const today = scheduleDate(now);
  const tomorrow = scheduleDate(addDays(now, 1));
  const nextId = days[0]?.sessions[0]?.id;
  return (
    <ol>
      {days.map((day) => {
        const first = day.sessions[0].scheduledAt;
        const isToday = day.key === today;
        const [month] = formatDayMonth(first).split(" ");
        return (
          <li
            key={day.key}
            className={`flex gap-5 px-5 py-5 border-b border-(--kt-border) last:border-b-0 ${isToday ? "bg-primary/5" : ""}`}
          >
            <h3 className="w-14 shrink-0 flex flex-col items-center text-center">
              <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-(--kt-muted)"}`}>
                {isToday ? "Today" : day.key === tomorrow ? "Tomorrow" : formatWeekday(first)}
              </span>
              <span className={`font-serif text-3xl leading-tight ${isToday ? "text-primary" : ""}`}>
                {Number(day.key.slice(-2))}
              </span>
              <span className="text-xs text-(--kt-muted)">{month}</span>
            </h3>

            <ol className="flex-1 min-w-0 flex flex-col gap-1 border-l border-(--kt-border)">
              {day.sessions.map((s) => {
                const isNext = s.id === nextId;
                return (
                  <li key={s.id} className="relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[5px] top-4 size-[9px] rounded-full border-2 border-primary ${isNext ? "bg-primary" : "bg-base-100"}`}
                    />
                    <Link
                      href={hrefFor(s.class.id)}
                      className={`flex! flex-col! items-stretch! w-[calc(100%-1rem)] ml-4 rounded px-3 py-2.5 transition-colors ${isNext ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-base-200"}`}
                    >
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-(--kt-muted) tabular-nums">
                        {formatTime(s.scheduledAt)} · {s.duration} min
                        {isNext && (
                          <span className="rounded-full bg-primary text-primary-content px-2 py-0.5 text-xs font-medium">
                            Next · {startsIn(s.scheduledAt, now, day.key === tomorrow)}
                          </span>
                        )}
                      </span>
                      <span className="block font-medium mt-0.5">{s.topic}</span>
                      <span className="block text-sm text-(--kt-muted)">{subjectDisplayLabel(s.class.subject)}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
