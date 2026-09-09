import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  CalendarClock,
  BookOpen,
  BadgeCheck,
  Users,
  Inbox,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tutorPoolWhere } from "@/lib/topicRequestVisibility";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import AssessmentsSummaryCard from "@/components/tutor/AssessmentsSummaryCard";
import WeeklyTimetable from "@/components/schedule/WeeklyTimetable";

function fmt(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const metadata = {
  title: "Tutor Portal | Katuwang",
};

export default async function TutorDashboard() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: {
      tutorProfile: {
        include: {
          topicCertifications: true,
          classes: { include: { topics: true, _count: { select: { enrollments: true } } } },
        },
      },
    },
  });

  const tutorProfile = user?.tutorProfile;
  const classes = tutorProfile?.classes ?? [];
  const certifications = tutorProfile?.topicCertifications ?? [];

  const now = new Date();
  const [openRequestCount, upcomingSessions, weeklySessions] = await Promise.all([
    tutorProfile
      ? prisma.topicCertification
          .findMany({
            where: { tutorProfileId: tutorProfile.id, status: "CERTIFIED" },
            select: { subject: true, topic: true },
          })
          .then((certifiedTopics) =>
            prisma.topicRequest.count({ where: tutorPoolWhere(tutorProfile.id, certifiedTopics) })
          )
      : Promise.resolve(0),
    tutorProfile
      ? prisma.classSession.findMany({
          where: {
            status: "SCHEDULED",
            scheduledAt: { gt: now },
            class: { tutorProfileId: tutorProfile.id },
          },
          orderBy: { scheduledAt: "asc" },
          take: 5,
          select: {
            id: true,
            topic: true,
            scheduledAt: true,
            duration: true,
            class: { select: { id: true, subject: true } },
          },
        })
      : Promise.resolve([]),
    tutorProfile
      ? prisma.classSession.findMany({
          where: {
            status: "SCHEDULED",
            scheduledAt: { gt: now, lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
            class: { tutorProfileId: tutorProfile.id },
          },
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            topic: true,
            scheduledAt: true,
            duration: true,
            class: { select: { id: true, subject: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const timetableSessions = weeklySessions.map((s) => ({
    id: s.id,
    topic: s.topic,
    subject: s.class.subject,
    classId: s.class.id,
    scheduledAt: s.scheduledAt.toISOString(),
    duration: s.duration,
  }));

  const enrolledLearnerCount = classes.reduce((sum, c) => sum + c._count.enrollments, 0);
  const isModerated = user?.status !== "ACTIVE";

  // Distinct (subject, topic) pairs the tutor currently teaches, across all their classes.
  const taughtTopics = Array.from(
    new Map(
      classes.flatMap((c) => c.topics.map((t) => [`${c.subject}::${t.topic}`, { subject: c.subject, topic: t.topic }]))
    ).values()
  );

  const certifiedCount = certifications.filter((c) => c.status === "CERTIFIED").length;
  const pendingCount = certifications.filter((c) => c.status === "PENDING").length;

  const steps = [
    { label: "Create your profile", done: true },
    { label: "Schedule your first class", done: classes.length > 0 },
    { label: "Request a topic assessment", done: certifications.length > 0 },
  ];
  const onboardingComplete = steps.every((s) => s.done);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Manage your tutoring"
        subtitle="Track your classes, sessions, and verified topics."
        actions={<AnonymousIdBadge id={session!.user.anonymousId} role="TUTOR" size="md" showIcon />}
      />

      {isModerated && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-error font-bold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Your account is {user?.status === "BANNED" ? "banned" : "suspended"}
          </div>
          {user?.statusReason && (
            <p className="text-xs text-base-content/80">
              <span className="font-semibold">Reason:</span> {user.statusReason}
            </p>
          )}
          <p className="text-xs text-base-content/70">
            {user?.statusExpiresAt
              ? `In effect until ${fmt(user.statusExpiresAt)}.`
              : "In effect indefinitely. Contact an administrator for details."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card kt-card kt-stat p-4 flex-row items-start justify-between gap-2">
          <div>
            <span className="kt-stat-title">Topics Taught</span>
            <span className="kt-stat-value">{taughtTopics.length}</span>
          </div>
          <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <BookOpen className="h-4 w-4" />
          </span>
        </div>
        <div className="card kt-card kt-stat p-4 flex-row items-start justify-between gap-2">
          <div>
            <span className="kt-stat-title">Verified Topics</span>
            <span className="kt-stat-value">{certifiedCount}</span>
          </div>
          <span className="p-2 rounded-lg bg-success/10 text-success shrink-0">
            <BadgeCheck className="h-4 w-4" />
          </span>
        </div>
        <Link
          href="/tutor/students"
          className="card kt-card kt-stat p-4 flex-row items-start justify-between gap-2 hover:border-primary/40 transition-colors"
        >
          <div>
            <span className="kt-stat-title">Enrolled Learners</span>
            <span className="kt-stat-value">{enrolledLearnerCount}</span>
          </div>
          <span className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
            <Users className="h-4 w-4" />
          </span>
        </Link>
        <Link
          href="/tutor/requests"
          className="card kt-card kt-stat p-4 flex-row items-start justify-between gap-2 hover:border-primary/40 transition-colors"
        >
          <div>
            <span className="kt-stat-title">Open Class Requests</span>
            <span className="kt-stat-value">{openRequestCount}</span>
          </div>
          <span className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
            <Inbox className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <section className="card kt-card">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Upcoming sessions
          </h2>
          {upcomingSessions.length === 0 ? (
            <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-6 text-center">
              No scheduled sessions across your classes.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingSessions.map((s) => {
                const d = new Date(s.scheduledAt);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/tutor/classes/${s.class.id}`}
                      className="flex items-center gap-3 rounded-lg border border-base-200 bg-base-200/20 hover:bg-base-200/50 hover:border-primary/30 p-3 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 text-primary px-2.5 py-1.5 shrink-0 w-14">
                        <span className="text-2xs font-bold uppercase leading-none">
                          {d.toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <span className="text-base font-bold leading-tight">{d.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-neutral badge-sm text-2xs uppercase font-bold">
                            {s.class.subject}
                          </span>
                          <span className="text-sm font-semibold text-base-content/85 truncate">
                            {s.topic}
                          </span>
                        </div>
                        <p className="text-2xs text-base-content/55 mt-0.5">
                          {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} ·{" "}
                          {s.duration} min
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-2">
          <h2 className="card-title text-sm font-bold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            This week
          </h2>
          <p className="text-2xs text-base-content/50">
            Your scheduled sessions over the next 7 days.
          </p>
          <WeeklyTimetable sessions={timetableSessions} />
        </div>
      </section>

      {/* Onboarding Checklist — hidden once every step is done */}
      {!onboardingComplete && (
      <section className="card kt-card">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold">Getting Started</h2>
          <ul className="space-y-2">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-xs text-base-content/80">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-base-content/30 shrink-0" />
                )}
                <span className={step.done ? "" : "text-base-content/50"}>{step.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      <AssessmentsSummaryCard certifiedCount={certifiedCount} pendingCount={pendingCount} />
    </div>
  );
}
