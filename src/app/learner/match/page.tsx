import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import MatchFinder from "@/components/learner/MatchFinder";

export const metadata = {
  title: "Find a Class | Katuwang",
};

export default async function LearnerMatchPage() {
  const session = await getServerSession(authOptions);
  const me = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { gradeLevel: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Find a class"
        subtitle="Tell us what you need and we'll rank the open classes that fit best."
      />
      <MatchFinder defaultGrade={me?.gradeLevel ?? ""} />
    </div>
  );
}
