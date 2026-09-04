import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, CalendarClock, BadgeCheck, FileQuestion, Inbox, History, Settings, BarChart3, ClipboardList, ClipboardCheck, Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import PortalLayout, { NavItem } from "@/components/layout/PortalLayout";

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" />, group: "Main menu" },
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" />, group: "Main menu" },
  { label: "Registrations", href: "/admin/registrations", icon: <UserCheck className="w-4 h-4" />, group: "Main menu" },
  { label: "Classes", href: "/admin/classes", icon: <CalendarClock className="w-4 h-4" />, group: "Main menu" },
  { label: "Topic Requests", href: "/admin/topic-requests", icon: <Inbox className="w-4 h-4" />, group: "Main menu" },
  { label: "Certifications", href: "/admin/certifications", icon: <BadgeCheck className="w-4 h-4" />, group: "Review" },
  { label: "Notifications", href: "/admin/notifications", icon: <Bell className="w-4 h-4" />, group: "Review" },
  { label: "Audit Log", href: "/admin/audit-log", icon: <History className="w-4 h-4" />, group: "Review" },
  { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="w-4 h-4" />, group: "Review" },
  { label: "Question Bank", href: "/admin/assessment/question-bank", icon: <FileQuestion className="w-4 h-4" />, group: "Assessment" },
  { label: "Requests", href: "/admin/assessment/requests", icon: <ClipboardList className="w-4 h-4" />, group: "Assessment" },
  { label: "Results", href: "/admin/assessment/results", icon: <ClipboardCheck className="w-4 h-4" />, group: "Assessment" },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" />, group: "General" },
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

  const [unreadCount, chatbotEnabled] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    getSetting("chatbotEnabled"),
  ]);

  const navItems: NavItem[] = ADMIN_NAV_ITEMS.map((item) =>
    item.href === "/admin/notifications" ? { ...item, badge: unreadCount } : item
  );

  return (
    <PortalLayout
      navItems={navItems}
      anonymousId={session.user.anonymousId}
      portalLabel="Admin Portal"
      accent="primary"
      unreadCount={unreadCount}
      notificationsHref="/admin/notifications"
      chatbotEnabled={chatbotEnabled}
    >
      {children}
    </PortalLayout>
  );
}
