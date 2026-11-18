import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import BackLink from "@/components/ui/BackLink";
import UserAvatar from "@/components/profile/UserAvatar";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { gradeNumber } from "@/lib/gradeLevels";

export const metadata = {
  title: "Student Profile | Katuwang",
};

export default async function TutorStudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });
  if (!tutorProfile) notFound();

  // Only learners enrolled in one of THIS tutor's classes are viewable.
  const enrollments = await prisma.classEnrollment.findMany({
    where: { learnerId: studentId, class: { tutorProfileId: tutorProfile.id } },
    select: {
      enrolledAt: true,
      withdrawnAt: true,
      class: { select: { id: true, code: true, subject: true, topics: { select: { topic: true } } } },
      learner: { select: { anonymousId: true, image: true, gradeLevel: true, section: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (enrollments.length === 0) notFound();

  const learner = enrollments[0].learner;
  const gradeLine = `Grade ${gradeNumber(learner.gradeLevel)} · Section ${learner.section}`;

  return (
    <div className="space-y-8 max-w-3xl">
      <BackLink href="/tutor/students">Back to students</BackLink>

      {/* The learner's ID is the heading, on the one tinted band in the learner colour (like the profile page). */}
      <section
        aria-labelledby="student-id"
        className="rounded-(--kt-radius-box) bg-secondary/10 px-5 py-6 sm:px-7 flex flex-col sm:flex-row sm:items-center gap-5"
      >
        <UserAvatar
          src={learner.image}
          anonymousId={learner.anonymousId}
          size="xl"
          role="LEARNER"
          subtitle={gradeLine}
        />
        <div className="min-w-0 space-y-1">
          <p className="font-serif italic text-base leading-none text-primary">Your student</p>
          <h1 id="student-id" className="kt-id kt-id--learner text-3xl sm:text-4xl leading-tight">
            {learner.anonymousId}
          </h1>
          <p>{gradeLine}</p>
          <p className="text-sm text-(--kt-muted)">
            Learners appear to tutors only by their ID — no real name, email or contact details.
          </p>
        </div>
      </section>

      <section className="card kt-card" aria-labelledby="student-classes">
        <div className="kt-card-body gap-2">
          <h2 id="student-classes" className="font-serif text-2xl font-medium leading-tight">
            Classes with you
          </h2>
          <ul>
            {enrollments.map((enr) => {
              const [firstTopic, ...otherTopics] = enr.class.topics.map((t) => t.topic);
              return (
                <li
                  key={enr.class.id}
                  className={`grid gap-x-6 gap-y-1 py-4 border-b border-(--kt-border) last:border-b-0 sm:grid-cols-[1fr_auto] ${enr.withdrawnAt ? "text-(--kt-muted)" : ""}`}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="flex flex-wrap gap-x-1.5 text-sm text-(--kt-muted)">
                      <span className="whitespace-nowrap">{subjectDisplayLabel(enr.class.subject)}</span>
                      <span className="whitespace-nowrap">· {enr.class.code}</span>
                    </p>
                    <h3 className="font-serif text-lg font-medium leading-snug">
                      <Link href={`/tutor/classes/${enr.class.id}`} className="link link-hover">
                        {firstTopic ?? subjectDisplayLabel(enr.class.subject)}
                      </Link>
                    </h3>
                    {otherTopics.length > 0 && (
                      <ul className="pl-3 border-l-2 border-(--kt-border) text-sm leading-snug space-y-1">
                        {otherTopics.map((t) => <li key={t}>{t}</li>)}
                      </ul>
                    )}
                  </div>
                  <p className="text-sm text-(--kt-muted) sm:text-right">
                    Enrolled {formatDate(enr.enrolledAt)}
                    {enr.withdrawnAt && (
                      <span className="block text-error">Withdrew {formatDate(enr.withdrawnAt)}</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
