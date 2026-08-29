import { getServerSession } from "next-auth";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import AssessmentsSummaryCard from "@/components/tutor/AssessmentsSummaryCard";

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
          classes: { include: { topics: true } },
        },
      },
    },
  });

  const tutorProfile = user?.tutorProfile;
  const classes = tutorProfile?.classes ?? [];
  const certifications = tutorProfile?.topicCertifications ?? [];

  const openRequestCount = await prisma.topicRequest.count({ where: { status: "OPEN" } });

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Manage your tutoring"
        subtitle="Track your onboarding progress, classes, and verified topics."
        actions={<AnonymousIdBadge id={session!.user.anonymousId} role="TUTOR" size="md" showIcon />}
      />

      <div className="stats bg-base-100 shadow-md border border-base-200 w-full sm:w-auto">
        <div className="stat py-4">
          <div className="stat-title text-2xs">Topics Taught</div>
          <div className="stat-value text-lg font-serif">{taughtTopics.length}</div>
        </div>
        <div className="stat py-4">
          <div className="stat-title text-2xs">Verified Topics</div>
          <div className="stat-value text-lg font-serif">{certifiedCount}</div>
        </div>
        <div className="stat py-4">
          <div className="stat-title text-2xs">Pending Requests</div>
          <div className="stat-value text-lg font-serif">{pendingCount}</div>
        </div>
        <Link href="/tutor/requests" className="stat py-4 hover:bg-base-200/40 transition-colors">
          <div className="stat-title text-2xs">Open Topic Requests</div>
          <div className="stat-value text-lg font-serif">{openRequestCount}</div>
        </Link>
      </div>

      {/* Onboarding Checklist */}
      <section className="card bg-base-100 shadow-md border border-base-200">
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

      <AssessmentsSummaryCard certifiedCount={certifiedCount} pendingCount={pendingCount} />
    </div>
  );
}
