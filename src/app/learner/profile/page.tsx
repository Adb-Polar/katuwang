import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";

export const metadata = {
  title: "Profile | Katuwang",
};

export default async function LearnerProfilePage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { contactInfo: true, section: true, gradeLevel: true },
  });

  return (
    <ProfileView
      eyebrow="Learner Portal"
      roleLabel="Student Learner"
      roleLabelClass="text-secondary"
      idRole="LEARNER"
      endpoint="/api/learner/profile"
      fullName={session!.user.fullName}
      email={session!.user.email}
      anonymousId={session!.user.anonymousId}
      gradeLevel={user?.gradeLevel}
      section={user?.section ?? ""}
      contactInfo={user?.contactInfo ?? ""}
    />
  );
}
