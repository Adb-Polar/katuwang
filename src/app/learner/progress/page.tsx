import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import MyProgressView from "@/components/learner/MyProgressView";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "My Progress | Katuwang",
};

export default async function LearnerProgressPage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  // Only classes with a published session test can show anything here, so the filter lists just those
  // (the same "non-draft test" rule /api/learner/progress uses).
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      learnerId: session!.user.id,
      class: { sessions: { some: { test: { is: { status: { not: "DRAFT" } } } } } },
    },
    select: { withdrawnAt: true, class: { select: { id: true, code: true, subject: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  const classOptions = enrollments.map(e => ({ ...e.class, withdrawnAt: e.withdrawnAt?.toISOString() ?? null }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pag-unlad mo"
        title="My progress"
        subtitle="Your score before and after each session's test."
      />
      <MyProgressView classOptions={classOptions} />
    </div>
  );
}
