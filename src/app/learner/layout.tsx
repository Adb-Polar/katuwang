import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, BookOpen, GraduationCap, Sparkles, Inbox, UserCircle } from "lucide-react";
import PortalLayout, { NavItem } from "@/components/layout/PortalLayout";

const LEARNER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/learner", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Browse Classes", href: "/learner/classes", icon: <BookOpen className="w-4 h-4" /> },
  { label: "My Classes", href: "/learner/my-classes", icon: <GraduationCap className="w-4 h-4" /> },
  { label: "Auto Match", href: "/learner/match", icon: <Sparkles className="w-4 h-4" /> },
  { label: "My Requests", href: "/learner/requests", icon: <Inbox className="w-4 h-4" /> },
  { label: "Profile", href: "/learner/profile", icon: <UserCircle className="w-4 h-4" /> },
];

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT_LEARNER") {
    redirect("/unauthorized");
  }

  return (
    <PortalLayout
      navItems={LEARNER_NAV_ITEMS}
      anonymousId={session.user.anonymousId}
      portalLabel="Learner Portal"
      accent="secondary"
      idRole="LEARNER"
    >
      {children}
    </PortalLayout>
  );
}
