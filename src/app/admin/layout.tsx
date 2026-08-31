import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, CalendarClock, BadgeCheck, History, Settings, BarChart3 } from "lucide-react";
import PortalLayout, { NavItem } from "@/components/layout/PortalLayout";

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
  { label: "Registrations", href: "/admin/registrations", icon: <UserCheck className="w-4 h-4" /> },
  { label: "Classes", href: "/admin/classes", icon: <CalendarClock className="w-4 h-4" /> },
  { label: "Certifications", href: "/admin/certifications", icon: <BadgeCheck className="w-4 h-4" /> },
  { label: "Audit Log", href: "/admin/audit-log", icon: <History className="w-4 h-4" /> },
  { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <PortalLayout
      navItems={ADMIN_NAV_ITEMS}
      anonymousId={session.user.anonymousId}
      portalLabel="Admin Portal"
      accent="primary"
    >
      {children}
    </PortalLayout>
  );
}
