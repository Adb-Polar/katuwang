import { getActiveServerSession } from "@/lib/serverSession";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getActiveServerSession();

  if (!session || !session.user) {
    redirect("/login");
    return;
  }

  const roleRedirects: Record<string, string> = {
    ADMIN: "/admin",
    SUPER_ADMIN: "/admin",
    STUDENT_TUTOR: "/tutor",
    STUDENT_LEARNER: "/learner",
  };

  const destination = roleRedirects[session.user.role];
  redirect(destination ?? "/login");
}
