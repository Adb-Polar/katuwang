import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";

export const metadata = {
  title: "Profile | Katuwang",
};

export default async function LearnerProfilePage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { contactInfo: true, section: true, gradeLevel: true, image: true },
  });

  return (
    <ProfileView
      eyebrow="Learner Portal"
      roleLabel="Student Learner"
      roleLabelClass="text-secondary"
      idRole="LEARNER"
      editHref="/learner/profile/edit"
      fullName={session!.user.fullName}
      email={session!.user.email}
      anonymousId={session!.user.anonymousId}
      gradeLevel={user?.gradeLevel}
      section={user?.section ?? ""}
      contactInfo={user?.contactInfo ?? ""}
      image={user?.image}
    />
  );
}
