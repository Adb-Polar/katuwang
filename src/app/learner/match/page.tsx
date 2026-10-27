import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import MatchFinder from "@/components/learner/MatchFinder";

export const metadata = {
  title: "Auto Match | Katuwang",
};

export default async function LearnerMatchPage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const me = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { gradeLevel: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Auto Match"
        subtitle="Tell us what you need and we'll rank the open classes that fit best."
      />
      <MatchFinder defaultGrade={me?.gradeLevel ?? ""} />
    </div>
  );
}
