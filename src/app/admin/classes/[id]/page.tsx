import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClassDetailsView from "@/components/classes/ClassDetailsView";
import SessionsList from "@/components/classes/SessionsList";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

export const metadata = { title: "Class Detail | Katuwang" };

function fmt(d: Date) {
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") notFound();

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
        backHref="/admin/classes"
        subject={tutorClass.subject}
        topics={topics}
        verifiedTopics={verifiedTopics}
        status={tutorClass.status}
        activeLabel="Scheduled"
        published={tutorClass.published}
        maxStudents={tutorClass.maxStudents}
        enrolledCount={tutorClass.enrollments.length}
        building={tutorClass.building}
        room={tutorClass.room}
        meetingLink={tutorClass.meetingLink}
        description={tutorClass.description}
        extraFacts={
          <div className="col-span-2 flex items-center gap-1.5">
            <div className="min-w-0">
              <div className="font-semibold text-2xs text-base-content/50">TUTOR</div>
              <div className="flex items-center gap-2">
                <AnonymousIdBadge id={tutorClass.tutorProfile.user.anonymousId} role="TUTOR" />
                <span className="text-base-content/60">
                  {tutorClass.tutorProfile.user.firstName} {tutorClass.tutorProfile.user.lastName}
                </span>
              </div>
            </div>
          </div>
        }
        sessions={
          <>
            <h2 className="card-title text-sm font-bold">Sessions</h2>
            <SessionsList
              sessions={tutorClass.sessions.map((s) => ({ ...s, scheduledAt: s.scheduledAt.toISOString() }))}
            />
          </>
        }
        roster={
          <>
            <h2 className="card-title text-sm font-bold">
              Enrolled Learners ({tutorClass.enrollments.length} / {tutorClass.maxStudents})
            </h2>
            {tutorClass.enrollments.length === 0 ? (
              <div className="text-center py-6 bg-base-200/10 border border-base-200 rounded-xl text-base-content/40 italic text-xs">
                No learners have enrolled in this class yet.
              </div>
            ) : (
              <div className="border border-base-200 rounded-xl overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-2xs">
                      <th>Anonymous ID</th>
                      <th>Grade &amp; Section</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tutorClass.enrollments.map((e) => (
                      <tr key={e.id} className="text-xs">
                        <td>
                          <AnonymousIdBadge id={e.learner.anonymousId} role="LEARNER" />
                        </td>
                        <td className="text-base-content/60">
                          {e.learner.gradeLevel.replace("_", " ")} · {e.learner.section}
                        </td>
                        <td className="text-base-content/60">{fmt(e.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        }
        sidebarExtra={
          tutorClass.status === "SUSPENDED" || tutorClass.status === "BANNED" ? (
            <div className="card bg-base-100 shadow-md border border-error/30">
              <div className="card-body gap-1 p-4">
                <h2 className="card-title text-sm font-bold text-error">Moderation</h2>
                {tutorClass.suspendedReason && (
                  <p className="text-xs text-base-content/70">
                    <span className="font-semibold">Reason:</span> {tutorClass.suspendedReason}
                  </p>
                )}
                <p className="text-xs text-base-content/70">
                  <span className="font-semibold">
                    {tutorClass.suspendedUntil ? "Until:" : "Duration:"}
                  </span>{" "}
                  {tutorClass.suspendedUntil ? fmt(tutorClass.suspendedUntil) : "Indefinite"}
                </p>
              </div>
            </div>
          ) : null
        }
        actions={null}
      />
    </div>
  );
}
