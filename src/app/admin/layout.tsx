import { getActiveServerSession } from "@/lib/serverSession";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, CalendarClock, BadgeCheck, FileQuestion, Inbox, History, Settings, ClipboardList, ClipboardCheck, Bell, Gavel, Flag, Tags, HelpCircle, MessageCircleQuestion, ListChecks, ShieldAlert, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isSuperAdminRole } from "@/lib/permissions";
import PortalLayout, { NavItem } from "@/components/layout/PortalLayout";

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" />, group: "Main menu" },
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" />, group: "Main menu" },
  { label: "Registrations", href: "/admin/registrations", icon: <UserCheck className="w-4 h-4" />, group: "Main menu" },
  { label: "Classes", href: "/admin/classes", icon: <CalendarClock className="w-4 h-4" />, group: "Main menu" },
  { label: "Certificates", href: "/admin/completion-certificates", icon: <BadgeCheck className="w-4 h-4" />, group: "Main menu" },
  { label: "Class requests", href: "/admin/topic-requests", icon: <Inbox className="w-4 h-4" />, group: "Main menu" },
  { label: "Class appeals", href: "/admin/class-appeals", icon: <Gavel className="w-4 h-4" />, group: "Review" },
  { label: "Abuse reports", href: "/admin/abuse-reports", icon: <Flag className="w-4 h-4" />, group: "Review" },
  { label: "Contact messages", href: "/admin/contact-messages", icon: <Mail className="w-4 h-4" />, group: "Review" },
  { label: "Notifications", href: "/admin/notifications", icon: <Bell className="w-4 h-4" />, group: "Review" },
  { label: "Chatbot", href: "/admin/chatbot", icon: <MessageCircleQuestion className="w-4 h-4" />, group: "Review" },
  { label: "Question bank", href: "/admin/assessment/question-bank", icon: <FileQuestion className="w-4 h-4" />, group: "Assessment" },
  { label: "Requests", href: "/admin/assessment/requests", icon: <ClipboardList className="w-4 h-4" />, group: "Assessment" },
  { label: "Results", href: "/admin/assessment/results", icon: <ClipboardCheck className="w-4 h-4" />, group: "Assessment" },
  { label: "Tutor certifications", href: "/admin/assessment/certifications", icon: <BadgeCheck className="w-4 h-4" />, group: "Assessment" },
  { label: "Session tests", href: "/admin/session-tests", icon: <ListChecks className="w-4 h-4" />, group: "Assessment" },
  { label: "Subjects & topics", href: "/admin/subjects", icon: <Tags className="w-4 h-4" />, group: "General" },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" />, group: "General" },
  { label: "Help & FAQs", href: "/admin/help", icon: <HelpCircle className="w-4 h-4" />, group: "General" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveServerSession();

  if (!session) {
    redirect("/login");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/unauthorized");
  }

  const isSuperAdmin = isSuperAdminRole(session.user.role);

  const [unreadCount, openContactCount] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    prisma.contactMessage.count({ where: { status: "OPEN" } }),
  ]);

  const baseNavItems: NavItem[] = isSuperAdmin
    ? [
        ...ADMIN_NAV_ITEMS,
        {
          label: "Audit log",
          href: "/admin/audit-log",
          icon: <History className="w-4 h-4" />,
          group: "Administration",
        },
        {
          label: "Admins",
          href: "/admin/admins",
          icon: <ShieldAlert className="w-4 h-4" />,
          group: "Administration",
        },
      ]
    : ADMIN_NAV_ITEMS;

  const navItems: NavItem[] = baseNavItems.map((item) =>
    item.href === "/admin/notifications"
      ? { ...item, badge: unreadCount }
      : item.href === "/admin/contact-messages"
        ? { ...item, badge: openContactCount }
        : item
  );

  return (
    <PortalLayout
      navItems={navItems}
      anonymousId={session.user.anonymousId}
      portalLabel="Admin Portal"
      accent="primary"
      unreadCount={unreadCount}
      notificationsHref="/admin/notifications"
      helpHref="/admin/help"
      profileHref="/admin/settings"
      defaultExpandedGroups={["Main menu", "Review"]}
    >
      {children}
    </PortalLayout>
  );
}
