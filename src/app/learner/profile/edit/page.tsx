import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import ProfileEditView from "@/components/profile/ProfileEditView";

export const metadata = {
  title: "Edit Profile | Katuwang",
};

export default async function LearnerProfileEditPage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      contactInfo: true,
      section: true,
      gradeLevel: true,
      image: true,
      profilePictureLocked: true,
    },
  });

  return (
    <ProfileEditView
      eyebrow="Learner Portal"
      backHref="/learner/profile"
      endpoint="/api/learner/profile"
      contactInfo={user?.contactInfo ?? ""}
      section={user?.section ?? ""}
      gradeLevel={user?.gradeLevel ?? ""}
      image={user?.image}
      profilePictureLocked={user?.profilePictureLocked ?? false}
    />
  );
}
