import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const roleRedirects: Record<string, string> = {
    ADMIN: "/admin",
    TEACHER_MODERATOR: "/moderator",
    STUDENT_TUTOR: "/tutor",
    STUDENT_LEARNER: "/learner",
  };

  const destination = roleRedirects[session.user.role];
  redirect(destination ?? "/login");
}
