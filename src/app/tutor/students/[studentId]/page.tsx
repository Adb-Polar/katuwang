import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { Calendar } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import UserAvatar from "@/components/profile/UserAvatar";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import { formatDate } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { gradeSection } from "@/lib/gradeLevels";

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
      class: { select: { id: true, subject: true, topics: { select: { topic: true } } } },
      learner: { select: { anonymousId: true, image: true, gradeLevel: true, section: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (enrollments.length === 0) notFound();

  const learner = enrollments[0].learner;

  return (
    <div className="space-y-6">
      <BackLink href="/tutor/students">Back to students</BackLink>

      <PageHeader
        eyebrow="Student Profile"
        title="Anonymized profile"
        subtitle="You never see a learner's real name, email, or contact details."
        actions={<AnonymousIdBadge id={learner.anonymousId} role="LEARNER" size="md" showIcon />}
      />

      <section className="card kt-card">
        <div className="card-body p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <UserAvatar
            src={learner.image}
            anonymousId={learner.anonymousId}
            size="xl"
            role="LEARNER"
            subtitle={gradeSection(learner.gradeLevel, learner.section)}
          />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-base font-bold text-base-content">
              Enrolled Student
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <AnonymousIdBadge id={learner.anonymousId} role="LEARNER" size="sm" showIcon />
              <span className="text-xs text-base-content/60">
                {gradeSection(learner.gradeLevel, learner.section)}
              </span>
            </div>
            <p className="text-2xs text-base-content/50 pt-1">
              {learner.image
                ? "Click profile picture to view full size."
                : "Student is using their anonymous monogram."}
            </p>
          </div>
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold">Enrolled in your classes ({enrollments.length})</h2>
          <div className="space-y-2">
            {enrollments.map((enr) => (
              <Link
                key={enr.class.id}
                href={`/tutor/classes/${enr.class.id}`}
                className="block border border-base-200 bg-base-200/20 hover:bg-base-200/40 rounded-lg p-3 space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge-neutral badge-sm text-2xs font-bold">{subjectDisplayLabel(enr.class.subject)}</span>
                  <span className="flex items-center gap-1 text-2xs text-base-content/50">
                    <Calendar className="h-3 w-3" />
                    {formatDate(enr.enrolledAt)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {enr.class.topics.map((t) => (
                    <span key={t.topic} className="badge badge-outline badge-sm text-2xs">
                      {t.topic}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
