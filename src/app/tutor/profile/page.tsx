import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";

export const metadata = {
  title: "Profile | Katuwang",
};

export default async function TutorProfilePage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      contactInfo: true,
      section: true,
      gradeLevel: true,
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
      endpoint="/api/tutor/profile"
      fullName={session!.user.fullName}
      email={session!.user.email}
      anonymousId={session!.user.anonymousId}
      gradeLevel={user?.gradeLevel}
      section={user?.section ?? ""}
      contactInfo={user?.contactInfo ?? ""}
      certifiedTopics={user?.tutorProfile?.topicCertifications ?? []}
    />
  );
}
