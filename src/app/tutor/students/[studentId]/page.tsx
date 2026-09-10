import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { GraduationCap, Calendar } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import { formatDate } from "@/lib/datetime";

export const metadata = {
  title: "Student Profile | Katuwang",
};

export default async function TutorStudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await getServerSession(authOptions);

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
      learner: { select: { anonymousId: true, gradeLevel: true, section: true } },
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
        <div className="card-body gap-3 text-xs">
          <h2 className="card-title text-sm font-bold">Details</h2>
          <div className="divider my-0" />
          <div className="flex items-center gap-1.5 text-base-content/70">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <span>
              {learner.gradeLevel.replace("_", " ")} · {learner.section}
            </span>
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
                  <span className="badge badge-neutral badge-sm text-2xs font-bold">{enr.class.subject}</span>
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
