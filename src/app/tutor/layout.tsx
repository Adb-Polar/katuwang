import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, CalendarClock, UserCircle } from "lucide-react";
import PortalLayout, { NavItem } from "@/components/layout/PortalLayout";

const TUTOR_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/tutor", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Classes", href: "/tutor/classes", icon: <CalendarClock className="w-4 h-4" /> },
  { label: "Profile", href: "/tutor/profile", icon: <UserCircle className="w-4 h-4" /> },
];

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT_TUTOR") {
    redirect("/unauthorized");
  }

  return (
    <PortalLayout
      navItems={TUTOR_NAV_ITEMS}
      anonymousId={session.user.anonymousId}
      portalLabel="Tutor Portal"
      accent="accent"
      idRole="TUTOR"
    >
      {children}
    </PortalLayout>
  );
}
