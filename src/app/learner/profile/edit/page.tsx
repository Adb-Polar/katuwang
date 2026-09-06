import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileEditView from "@/components/profile/ProfileEditView";

export const metadata = {
  title: "Edit Profile | Katuwang",
};

export default async function LearnerProfileEditPage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { contactInfo: true, section: true, gradeLevel: true },
  });

  return (
    <ProfileEditView
      eyebrow="Learner Portal"
      backHref="/learner/profile"
      endpoint="/api/learner/profile"
      contactInfo={user?.contactInfo ?? ""}
      section={user?.section ?? ""}
      gradeLevel={user?.gradeLevel ?? ""}
    />
  );
}
