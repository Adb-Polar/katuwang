import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileEditView from "@/components/profile/ProfileEditView";

export const metadata = {
  title: "Edit Profile | Katuwang",
};

export default async function TutorProfileEditPage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { contactInfo: true, section: true, gradeLevel: true },
  });

  return (
    <ProfileEditView
      eyebrow="Tutor Portal"
      backHref="/tutor/profile"
      endpoint="/api/tutor/profile"
      contactInfo={user?.contactInfo ?? ""}
      section={user?.section ?? ""}
      gradeLevel={user?.gradeLevel ?? ""}
    />
  );
}
