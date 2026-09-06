import Link from "next/link";

export interface TimetableSession {
  id: string;
  topic: string;
  subject: string;
  classId: string;
  /** ISO string */
  scheduledAt: string;
  duration: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * A Mon–Sun grid of the tutor's sessions in the next 7 days — one column per
 * weekday, each a time-ordered stack of session chips. Replaces the flat
 * "weekly schedule" list on the dashboard.
 */
export default function WeeklyTimetable({
  sessions,
  emptyMessage = "No sessions in the next 7 days.",
}: {
  sessions: TimetableSession[];
  emptyMessage?: string;
}) {
  if (sessions.length === 0) {
    return (
      <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-6 text-center">
        {emptyMessage}
      </p>
    );
  }

  const byDay: Record<number, TimetableSession[]> = {};
  for (const s of sessions) {
    const idx = (new Date(s.scheduledAt).getDay() + 6) % 7; // Mon = 0 … Sun = 6
    (byDay[idx] ??= []).push(s);
  }
  for (const list of Object.values(byDay)) {
    list.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {DAYS.map((day, i) => (
        <div key={day} className="rounded-lg border border-base-200 bg-base-200/20 p-2 min-h-[5rem]">
          <div className="text-2xs font-bold uppercase tracking-wide text-base-content/50 mb-1.5">
            {day}
          </div>
          <div className="space-y-1">
            {(byDay[i] ?? []).length === 0 ? (
              <div className="text-2xs text-base-content/25">—</div>
            ) : (
              byDay[i].map((s) => (
                <Link
                  key={s.id}
                  href={`/tutor/classes/${s.classId}`}
                  className="block rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/20 px-1.5 py-1 text-2xs transition-colors"
                >
                  <div className="font-bold text-primary/90">
                    {new Date(s.scheduledAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
  );
}
