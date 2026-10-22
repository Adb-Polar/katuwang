import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";

export const metadata = {
  title: "Profile | Katuwang",
};

export default async function TutorProfilePage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      contactInfo: true,
      section: true,
      gradeLevel: true,
      image: true,
      tutorProfile: {
        select: {
          topicCertifications: {
            where: { status: "CERTIFIED" },
            select: { subject: true, topic: true },
            orderBy: [{ subject: "asc" }, { topic: "asc" }],
          },
        },
      },
    },
  });

  return (
    <ProfileView
      eyebrow="Tutor Portal"
      roleLabel="Student Tutor"
      roleLabelClass="text-accent-content"
      idRole="TUTOR"
      editHref="/tutor/profile/edit"
      fullName={session!.user.fullName}
      email={session!.user.email}
      anonymousId={session!.user.anonymousId}
      gradeLevel={user?.gradeLevel}
      section={user?.section ?? ""}
      contactInfo={user?.contactInfo ?? ""}
      certifiedTopics={user?.tutorProfile?.topicCertifications ?? []}
      image={user?.image}
    />
  );
}
