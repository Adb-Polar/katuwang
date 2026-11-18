import Link from "next/link";
import { scheduleDate, scheduleTime, timetableDays } from "@/lib/scheduleDates";
import { SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";

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

  if (sessions.length === 0) return <p className="text-(--kt-muted)">{emptyMessage}</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-(--kt-muted)">Times shown in {SCHOOL_TIME_ZONE_LABEL}.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-3 gap-y-5">
        {days.map(({ date, day, label }) => (
          <div key={date} className="min-w-0 border-t border-(--kt-border) pt-2">
            <div className="text-sm text-(--kt-muted) mb-2">
              <span>{day}</span> <time dateTime={date}>{label}</time>
            </div>
            <div className="space-y-1.5">
              {(byDay[date] ?? []).length === 0 ? (
                <p className="text-sm text-(--kt-muted)">
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">No sessions</span>
                </p>
              ) : (
                byDay[date].map((s) => (
                  <Link
                    key={s.id}
                    href={hrefFor(s.classId)}
                    // flex!: the portal's phone touch-target rule turns links into one centred row.
                    className="flex! flex-col! items-stretch! rounded px-2 py-1.5 bg-primary/10 hover:bg-primary/15 text-sm transition-colors"
                  >
                    <span className="font-medium text-primary tabular-nums">{scheduleTime(s.scheduledAt)}</span>
                    <span className="truncate" title={`${subjectDisplayLabel(s.subject)} — ${s.topic}`}>
                      {s.topic}
                    </span>
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
