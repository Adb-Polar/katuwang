import CertificateList from "@/components/certificates/CertificateList";
import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { addDays, formatDayMonth, formatTime, formatWeekday, SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import { scheduleDate } from "@/lib/scheduleDates";
import { subjectDisplayLabel } from "@/lib/displayLabels";

export const metadata = {
  title: "Learner Portal | Katuwang",
};

type DashboardSession = {
  id: string;
  topic: string;
  scheduledAt: Date;
  duration: number;
  class: { id: string; subject: string };
};

const SESSION_SELECT = {
  id: true,
  topic: true,
  scheduledAt: true,
  duration: true,
  class: { select: { id: true, subject: true } },
} as const;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function LearnerDashboard() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const learnerId = session!.user.id;

  const now = new Date();
  const weekAhead = addDays(now, 7);
  const enrolled = { enrollments: { some: { learnerId, withdrawnAt: null } } };

  const [enrolledCount, openRequestCount, upcomingSessions, weeklySessions] = await Promise.all([
    prisma.classEnrollment.count({ where: { learnerId, withdrawnAt: null } }),
    prisma.topicRequest.count({ where: { learnerId, status: "OPEN", expiresAt: { gt: now } } }),
    // Only used when nothing is scheduled this week: "your next session is …".
    prisma.classSession.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gt: now }, class: enrolled },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      select: SESSION_SELECT,
    }),
    prisma.classSession.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gt: now, lte: weekAhead }, class: enrolled },
      orderBy: { scheduledAt: "asc" },
      select: SESSION_SELECT,
    }),
  ]);

  const today = scheduleDate(now);
  const tomorrow = scheduleDate(addDays(now, 1));
  const days = groupByDay(weeklySessions);
  const laterDays = groupByDay(upcomingSessions);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Learner Portal"
        title="Your week"
        subtitle={`Your sessions for the next 7 days. Times are in ${SCHOOL_TIME_ZONE_LABEL}.`}
      />

      <nav aria-label="Your numbers" className="flex flex-wrap gap-x-6 gap-y-2 -mt-4">
        <Link href="/learner/my-classes" className="link link-hover text-primary">
          {plural(enrolledCount, "enrolled class", "enrolled classes")}
        </Link>
        <span className="text-(--kt-muted)">{plural(weeklySessions.length, "session", "sessions")} this week</span>
        <Link href="/learner/tutors?tab=requests" className="link link-hover text-primary">
          {plural(openRequestCount, "open topic request", "open topic requests")}
        </Link>
      </nav>

      <section aria-labelledby="this-week" className="kt-card">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-(--kt-border)">
          <h2 id="this-week" className="font-serif text-xl font-medium">
            This week
          </h2>
          <Link href="/learner/my-classes" className="link link-hover text-primary text-sm">
            My classes
          </Link>
        </div>

        {days.length > 0 ? (
          <DayRail days={days} today={today} tomorrow={tomorrow} now={now} />
        ) : laterDays.length > 0 ? (
          <>
            <p className="px-5 pt-5 text-(--kt-muted)">Nothing scheduled in the next 7 days. Your next sessions:</p>
            <DayRail days={laterDays} today={today} tomorrow={tomorrow} now={now} />
          </>
        ) : (
          <p className="px-5 py-6">
            No sessions yet.{" "}
            <Link href="/learner/classes" className="link text-primary">
              Browse classes
            </Link>{" "}
            to enroll in one.
          </p>
        )}
      </section>

      <CertificateList preview />
    </div>
  );
}

type DayGroup = { key: string; sessions: DashboardSession[] };

/** Groups sessions (already in time order) by school-calendar day. */
function groupByDay(sessions: DashboardSession[]): DayGroup[] {
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
 * The week as a calendar rail: a date column per day (big serif day number, Today in brand
 * blue) and that day's sessions on a thin timeline. The very next session gets a filled dot
 * and a "Next" pill so the list answers "what's my next class?" at a glance.
 */
function DayRail({ days, today, tomorrow, now }: { days: DayGroup[]; today: string; tomorrow: string; now: Date }) {
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
                      href={`/learner/classes/${s.class.id}?from=browse`}
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
