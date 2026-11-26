import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { tutorPoolWhere } from "@/lib/topicRequestVisibility";
import { addDays, formatDateTime, SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import PageHeader from "@/components/ui/PageHeader";
import ReportDownloadButtons from "@/components/reports/ReportDownloadButtons";
import WeekDayRail, { groupByDay } from "@/components/schedule/WeekDayRail";

export const metadata = {
  title: "Tutor Portal | Katuwang",
};

const SESSION_SELECT = {
  id: true,
  topic: true,
  scheduledAt: true,
  duration: true,
  class: { select: { id: true, subject: true } },
} as const;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const tutorClassHref = (classId: string) => `/tutor/classes/${classId}`;

export default async function TutorDashboard() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      status: true,
      statusReason: true,
      statusExpiresAt: true,
      tutorProfile: {
        select: {
          id: true,
          topicCertifications: { select: { subject: true, topic: true, status: true } },
          classes: { select: { _count: { select: { enrollments: { where: { withdrawnAt: null } } } } } },
        },
      },
    },
  });

  const tutorProfile = user?.tutorProfile;
  const classes = tutorProfile?.classes ?? [];
  const certifications = tutorProfile?.topicCertifications ?? [];
  const certifiedTopics = certifications
    .filter((c) => c.status === "CERTIFIED")
    .map(({ subject, topic }) => ({ subject, topic }));
  const pendingCount = certifications.filter((c) => c.status === "PENDING").length;

  const now = new Date();
  const ownSessions = { status: "SCHEDULED" as const, class: { tutorProfileId: tutorProfile?.id } };
  const [openRequestCount, upcomingSessions, weeklySessions] = tutorProfile
    ? await Promise.all([
        prisma.topicRequest.count({ where: tutorPoolWhere(tutorProfile.id, certifiedTopics) }),
        // Only used when nothing is scheduled this week: "your next sessions are …".
        prisma.classSession.findMany({
          where: { ...ownSessions, scheduledAt: { gt: now } },
          orderBy: { scheduledAt: "asc" },
          take: 3,
          select: SESSION_SELECT,
        }),
        prisma.classSession.findMany({
          where: { ...ownSessions, scheduledAt: { gt: now, lte: addDays(now, 7) } },
          orderBy: { scheduledAt: "asc" },
          select: SESSION_SELECT,
        }),
      ])
    : [0, [], []];

  const enrolledLearnerCount = classes.reduce((sum, c) => sum + c._count.enrollments, 0);
  const isModerated = user?.status !== "ACTIVE";
  const days = groupByDay(weeklySessions);
  const laterDays = groupByDay(upcomingSessions);

  const steps = [
    { label: "Schedule your first class", done: classes.length > 0, href: "/tutor/classes/new" },
    { label: "Take a topic assessment", done: certifications.length > 0, href: "/tutor/assessments" },
  ];
  const onboardingComplete = steps.every((s) => s.done);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Your week"
        subtitle={`Your sessions for the next 7 days. Times are in ${SCHOOL_TIME_ZONE_LABEL}.`}
      />

      {isModerated && (
        <div role="alert" className="rounded-(--kt-radius-box) border border-error/30 bg-error/10 px-5 py-4 space-y-1">
          <p className="flex items-center gap-2 text-error font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Your account is {user?.status === "BANNED" ? "banned" : "suspended"}
          </p>
          {user?.statusReason && (
            <p className="text-sm">
              <span className="font-semibold">Reason:</span> {user.statusReason}
            </p>
          )}
          <p className="text-sm text-(--kt-muted)">
            {user?.statusExpiresAt
              ? `In effect until ${formatDateTime(user.statusExpiresAt)}.`
              : "In effect indefinitely. Contact an administrator for details."}
          </p>
        </div>
      )}

      <nav aria-label="Your numbers" className="flex flex-wrap gap-x-6 gap-y-2 -mt-4">
        <Link href="/tutor/students" className="link link-hover text-primary">
          {plural(enrolledLearnerCount, "learner enrolled", "learners enrolled")}
        </Link>
        <span className="text-(--kt-muted)">{plural(weeklySessions.length, "session", "sessions")} this week</span>
        <Link href="/tutor/requests" className="link link-hover text-primary">
          {plural(openRequestCount, "open class request", "open class requests")}
        </Link>
        <Link href="/tutor/assessments" className="link link-hover text-primary">
          {plural(certifiedTopics.length, "certified topic", "certified topics")}
          {pendingCount > 0 && `, ${pendingCount} pending`}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="this-week" className="kt-card">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-(--kt-border)">
            <h2 id="this-week" className="font-serif text-xl font-medium">
              This week
            </h2>
            <Link href="/tutor/classes" className="link link-hover text-primary text-sm">
              My classes
            </Link>
          </div>

          {days.length > 0 ? (
            <WeekDayRail days={days} now={now} hrefFor={tutorClassHref} />
          ) : laterDays.length > 0 ? (
            <>
              <p className="px-5 pt-5 text-(--kt-muted)">Nothing scheduled in the next 7 days. Your next sessions:</p>
              <WeekDayRail days={laterDays} now={now} hrefFor={tutorClassHref} />
            </>
          ) : (
            <p className="px-5 py-6">
              No sessions scheduled.{" "}
              <Link href="/tutor/classes/new" className="link text-primary">
                Create a class
              </Link>{" "}
              to start teaching.
            </p>
          )}
        </section>

        <div className="flex flex-col gap-8">
          {!onboardingComplete && (
            <section aria-labelledby="getting-started" className="kt-card">
              <h2 id="getting-started" className="font-serif text-xl font-medium px-5 py-4 border-b border-(--kt-border)">
                Getting started
              </h2>
              <ol className="px-5 py-4 space-y-3">
                {steps.map((step) => (
                  <li key={step.label} className="flex items-center gap-3">
                    {step.done ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" aria-hidden="true" />
                        <span className="text-(--kt-muted) line-through">{step.label}</span>
                        <span className="sr-only">(done)</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-5 w-5 text-(--kt-muted) shrink-0" aria-hidden="true" />
                        <Link href={step.href} className="link text-primary">
                          {step.label}
                        </Link>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section aria-labelledby="tutor-quick-actions" className="kt-card">
            <h2 id="tutor-quick-actions" className="font-serif text-xl font-medium px-5 py-4 border-b border-(--kt-border)">
              Quick actions
            </h2>
            <ul className="px-5 py-4 space-y-3">
            <li>
              <Link href="/tutor/classes/new" className="link link-hover text-primary">
                Create a class
              </Link>
              <p className="text-sm text-(--kt-muted)">Schedule sessions for a topic you are certified in.</p>
            </li>
            <li>
              <Link href="/tutor/requests" className="link link-hover text-primary">
                Review class requests
              </Link>
              <p className="text-sm text-(--kt-muted)">See what learners are asking for.</p>
            </li>
            <li>
              <Link href="/tutor/assessments" className="link link-hover text-primary">
                Take a topic assessment
              </Link>
              <p className="text-sm text-(--kt-muted)">Get certified to teach more topics.</p>
            </li>
            <li>
              <Link href="/tutor/students" className="link link-hover text-primary">
                View your students
              </Link>
              <p className="text-sm text-(--kt-muted)">Rosters and progress, by anonymous ID.</p>
            </li>
            </ul>
          </section>
          <section aria-labelledby="tutor-reports" className="kt-card">
            <div className="px-5 py-4 border-b border-(--kt-border)">
              <h2 id="tutor-reports" className="font-serif text-xl font-medium">Reports</h2>
              <p className="text-sm text-(--kt-muted)">Your classes, sessions, learner gains and quiz record for a date range. Learners appear by anonymous ID only.</p>
            </div>
            <div className="px-5 py-4">
              <ReportDownloadButtons endpoint="/api/tutor/report" params={{ scope: "summary" }} label="Download tutoring summary" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
