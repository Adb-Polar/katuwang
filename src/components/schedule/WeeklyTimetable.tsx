import Link from "next/link";
import { scheduleDate, scheduleTime, timetableDays } from "@/lib/scheduleDates";

export interface TimetableSession {
  id: string;
  topic: string;
  subject: string;
  classId: string;
  /** ISO string */
  scheduledAt: string;
  duration: number;
}

/**
 * A dated grid of sessions in the next 7 days — one column per weekday, each a
 * time-ordered stack of session chips. Used on the tutor dashboard and (with a
 * learner-facing `hrefFor`) the learner dashboard + tutor-profile page.
 */
export default function WeeklyTimetable({
  sessions,
  emptyMessage = "No sessions in the next 7 days.",
  hrefFor = (classId) => `/tutor/classes/${classId}`,
}: {
  sessions: TimetableSession[];
  emptyMessage?: string;
  /** where a session chip links to; defaults to the tutor class page */
  hrefFor?: (classId: string) => string;
}) {
  const days = timetableDays(new Date());
  // A rolling seven-day query can touch eight calendar dates. Keep boundary sessions visible.
  for (const session of sessions) {
    const date = scheduleDate(session.scheduledAt);
    if (!days.some((day) => day.date === date)) {
      days.push(timetableDays(new Date(`${date}T12:00:00+08:00`))[0]);
    }
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  const byDay: Record<string, TimetableSession[]> = {};
  for (const s of sessions) {
    const date = scheduleDate(s.scheduledAt);
    (byDay[date] ??= []).push(s);
  }
  for (const list of Object.values(byDay)) {
    list.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  }

  return (
    <div className="space-y-2">
      {sessions.length === 0 && <p className="text-xs text-base-content/50 italic">{emptyMessage}</p>}
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {days.map(({ date, day, label }) => (
        <div key={date} className="rounded-lg border border-base-200 bg-base-200/20 p-2 min-h-[5rem]">
          <div className="text-2xs font-bold uppercase tracking-wide text-base-content/50 mb-1.5">
            <span>{day}</span> <time dateTime={date}>{label}</time>
          </div>
          <div className="space-y-1">
            {(byDay[date] ?? []).length === 0 ? (
              <div className="text-2xs text-base-content/25">—</div>
            ) : (
              byDay[date].map((s) => (
                <Link
                  key={s.id}
                  href={hrefFor(s.classId)}
                  className="block rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/20 px-1.5 py-1 text-2xs transition-colors"
                >
                  <div className="font-bold text-primary/90">
                    {scheduleTime(s.scheduledAt)}
                  </div>
                  <div className="truncate text-base-content/70" title={`${s.subject} — ${s.topic}`}>
                    {s.topic}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}
