import { notFound } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import ClassDetailsView from "@/components/classes/ClassDetailsView";
import { nextSessionAt } from "@/components/classes/classStatus";
import SessionsList from "@/components/classes/SessionsList";
import RecommendClassForm from "@/components/classes/RecommendClassForm";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import { formatDateTime } from "@/lib/datetime";
import { gradeSection } from "@/lib/gradeLevels";
import { isAdminRole } from "@/lib/permissions";

export const metadata = { title: "Class Detail | Katuwang" };

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getActiveServerSession();
  if (!session || !isAdminRole(session.user.role)) notFound();

  const tutorClass = await prisma.tutorClass.findUnique({
    where: { id },
    include: {
      topics: { select: { topic: true } },
      sessions: { orderBy: { scheduledAt: "asc" } },
      tutorProfile: {
        select: {
          user: { select: { anonymousId: true, firstName: true, lastName: true } },
          topicCertifications: {
            where: { status: "CERTIFIED" },
            select: { subject: true, topic: true },
          },
        },
      },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          enrolledAt: true,
          learner: { select: { anonymousId: true, gradeLevel: true, section: true } },
        },
      },
    },
  });

  if (!tutorClass) notFound();

  const topics = tutorClass.topics.map((t) => t.topic);
  const verifiedTopics = tutorClass.tutorProfile.topicCertifications
    .filter((c) => c.subject === tutorClass.subject)
    .map((c) => c.topic);

  return (
    <div className="space-y-6">
      <ClassDetailsView
        audience="admin"
        backHref="/admin/classes"
        backLabel="Back to classes"
        code={tutorClass.code}
        subject={tutorClass.subject}
        gradeLevel={tutorClass.gradeLevel}
        topics={topics}
        verifiedTopics={verifiedTopics}
        status={tutorClass.status}
        published={tutorClass.published}
        maxStudents={tutorClass.maxStudents}
        enrolledCount={tutorClass.enrollments.length}
        nextSessionAt={nextSessionAt(tutorClass.sessions)}
        building={tutorClass.building}
        room={tutorClass.room}
        meetingLink={tutorClass.meetingLink}
        description={tutorClass.description}
        tutor={
          <span>
            <AnonymousIdText id={tutorClass.tutorProfile.user.anonymousId} role="TUTOR" />{" "}
            <span className="text-base-content">
              {tutorClass.tutorProfile.user.firstName} {tutorClass.tutorProfile.user.lastName}
            </span>
          </span>
        }
        sessions={
          <>
            <h2 className="font-serif text-xl font-medium">Sessions</h2>
            <SessionsList
              variant="calendar"
              sessions={tutorClass.sessions.map((s) => ({ ...s, scheduledAt: s.scheduledAt.toISOString() }))}
            />
          </>
        }
        roster={
          <>
            <h2 className="font-serif text-xl font-medium">
              Enrolled learners <span className="text-(--kt-muted) text-base">{tutorClass.enrollments.length} of {tutorClass.maxStudents}</span>
            </h2>
            {tutorClass.enrollments.length === 0 ? (
              <p className="py-3 text-sm text-(--kt-muted)">
                No learners have enrolled in this class yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Anonymous ID</th>
                      <th>Grade and section</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tutorClass.enrollments.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <AnonymousIdText id={e.learner.anonymousId} role="LEARNER" />
                        </td>
                        <td className="text-(--kt-muted)">
                          {gradeSection(e.learner.gradeLevel, e.learner.section)}
                        </td>
                        <td className="text-(--kt-muted)">{formatDateTime(e.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        }
        sidebarExtra={
          <>
            {(tutorClass.status === "SUSPENDED" || tutorClass.status === "BANNED") && (
              <div className="card kt-card border-error/40!">
                <div className="kt-card-body gap-1">
                  <h2 className="font-serif text-xl font-medium text-error">Moderation</h2>
                  {tutorClass.suspendedReason && (
                    <p className="text-sm text-(--kt-muted)">
                      <span className="font-semibold">Reason:</span> {tutorClass.suspendedReason}
                    </p>
                  )}
                  <p className="text-sm text-(--kt-muted)">
                    <span className="font-semibold">
                      {tutorClass.suspendedUntil ? "Until:" : "Duration:"}
                    </span>{" "}
                    {tutorClass.suspendedUntil ? formatDateTime(tutorClass.suspendedUntil) : "Indefinite"}
                  </p>
                </div>
              </div>
            )}
            <RecommendClassForm classId={id} />
          </>
        }
        actions={null}
      />
    </div>
  );
}
