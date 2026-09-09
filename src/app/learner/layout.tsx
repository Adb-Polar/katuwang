import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, BookOpen, GraduationCap, Sparkles, Inbox, Bell, UserCircle, HelpCircle, Users, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import PortalLayout, { NavItem } from "@/components/layout/PortalLayout";

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

  const [unreadCount, chatbotEnabled] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    getSetting("chatbotEnabled"),
  ]);

  const LEARNER_NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/learner", icon: <LayoutDashboard className="w-4 h-4" />, group: "Main menu" },
    { label: "Browse Classes", href: "/learner/classes", icon: <BookOpen className="w-4 h-4" />, group: "Main menu" },
    { label: "Find Tutors", href: "/learner/tutors", icon: <Users className="w-4 h-4" />, group: "Main menu" },
    { label: "My Classes", href: "/learner/my-classes", icon: <GraduationCap className="w-4 h-4" />, group: "Main menu" },
    { label: "My Progress", href: "/learner/progress", icon: <TrendingUp className="w-4 h-4" />, group: "Main menu" },
    { label: "Auto Match", href: "/learner/match", icon: <Sparkles className="w-4 h-4" />, group: "Tools" },
    { label: "My Requests", href: "/learner/requests", icon: <Inbox className="w-4 h-4" />, group: "Tools" },
    { label: "Notifications", href: "/learner/notifications", icon: <Bell className="w-4 h-4" />, group: "Tools", badge: unreadCount },
    { label: "Profile", href: "/learner/profile", icon: <UserCircle className="w-4 h-4" />, group: "Account" },
    { label: "Help & FAQs", href: "/learner/help", icon: <HelpCircle className="w-4 h-4" />, group: "Account" },
  ];

  return (
    <PortalLayout
      navItems={LEARNER_NAV_ITEMS}
      anonymousId={session.user.anonymousId}
      portalLabel="Learner Portal"
      accent="secondary"
      idRole="LEARNER"
      unreadCount={unreadCount}
      notificationsHref="/learner/notifications"
      helpHref="/learner/help"
      profileHref="/learner/profile"
      chatbotEnabled={chatbotEnabled}
    >
      {children}
    </PortalLayout>
  );
}
