import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MyProgressView from "@/components/learner/MyProgressView";

export const metadata = {
  title: "My Progress | Katuwang",
};

export default async function LearnerProgressPage() {
  const session = await getServerSession(authOptions);

  const enrollments = await prisma.classEnrollment.findMany({
    where: { learnerId: session!.user.id },
    select: { class: { select: { id: true, code: true, subject: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  const classOptions = enrollments.map((e) => e.class);

  return (
    <div className="space-y-6">
      <MyProgressView classOptions={classOptions} />
    </div>
  );
}
