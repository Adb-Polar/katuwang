"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, LogOut, Menu, Search, X } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatWidget from "@/components/chatbot/ChatWidget";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** sidebar section this item belongs under; items keep first-seen group order */
  group?: string;
  /** unread count shown as a small badge after the label; omitted/0 renders nothing */
  badge?: number;
}

type PortalAccent = "primary" | "secondary" | "accent";

interface PortalLayoutProps {
  navItems: NavItem[];
  anonymousId: string;
  portalLabel: string;
  accent: PortalAccent;
  idRole?: "LEARNER" | "TUTOR";
  /** unread notification count — drives the topbar bell dot; refreshed on navigation */
  unreadCount?: number;
  /** portal-specific notifications page, e.g. "/tutor/notifications" */
  notificationsHref?: string;
  /** when true, mounts the floating intent-based help assistant */
  chatbotEnabled?: boolean;
  children: React.ReactNode;
}

const PORTAL_ROOTS = ["/admin", "/tutor", "/learner"];

export default function PortalLayout({
  navItems,
  anonymousId,
  portalLabel,
  idRole,
  unreadCount = 0,
  notificationsHref = "/dashboard",
  chatbotEnabled = false,
  children,
}: PortalLayoutProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer on navigation (adjust state during render — no effect).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  // Lock body scroll and wire Escape-to-close while the drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    PORTAL_ROOTS.includes(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const groups: { name: string; items: NavItem[] }[] = [];
  for (const item of navItems) {
    const name = item.group ?? "Menu";
    let g = groups.find((x) => x.name === name);
    if (!g) {
      g = { name, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }

  const navTree = (
    <nav className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.name} className="flex flex-col gap-0.5">
          <span className="kt-nav-label">{g.name}</span>
          {g.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href) ? "true" : "false"}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="kt-nav-item"
            >
              <span className="kt-ic">{item.icon}</span>
              {item.label}
              {!!item.badge && item.badge > 0 && (
                <span className="badge badge-error badge-xs ml-auto">{item.badge > 99 ? "99+" : item.badge}</span>
              )}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  const idNode = idRole ? (
    <AnonymousIdBadge id={anonymousId} role={idRole} showIcon />
  ) : (
    <span className="font-mono text-xs font-semibold text-primary">{anonymousId}</span>
  );

  const logoutLink = (
    <Link
      href="/logout"
      className="flex items-center gap-2 text-sm font-medium text-error/80 hover:text-error transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Log Out
    </Link>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-[15.5rem_minmax(0,1fr)] bg-base-200">
      {/* desktop sidebar */}
      <aside className="kt-sidebar hidden lg:flex flex-col gap-6 p-3 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 px-2 pt-1">
          <BrandMark />
          <p className="font-sans font-bold text-base tracking-tight">Katuwang</p>
        </div>
        <span className="kt-nav-label pb-0! px-2! text-primary">{portalLabel}</span>
        <div className="flex-1">{navTree}</div>
        <div className="flex flex-col gap-3 px-2 pb-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-2xs font-semibold uppercase tracking-wide text-base-content/45">
              Anonymous ID
            </span>
            {idNode}
          </div>
          {logoutLink}
        </div>
      </aside>

      {/* content column */}
      <div className="flex flex-col min-w-0">
        <header className="kt-topbar">
          {/* mobile drawer toggle */}
          <button
            type="button"
            className="lg:hidden btn btn-ghost btn-sm btn-square"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandMark size="sm" />

          <div className="kt-search hidden sm:flex">
            <Search className="w-4 h-4 shrink-0" />
            <input type="search" placeholder="Search classes, tutors, topics…" aria-label="Search" />
            <kbd className="text-2xs font-mono border border-base-300 rounded px-1 py-0.5 hidden md:inline">
              ⌘K
            </kbd>
          </div>

          <div className="flex-1" />

          <button type="button" className="kt-icon-btn" aria-label="Help">
            <HelpCircle className="w-4 h-4" />
          </button>
          <NotificationBell unreadCount={unreadCount} notificationsHref={notificationsHref} />
          <span className="kt-avatar" aria-hidden="true">
            {anonymousId.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!menuOpen}
        className={`kt-sidebar fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col gap-6 overflow-y-auto p-3 shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
          <div className="flex items-center justify-between gap-3 px-2 pt-1">
            <div className="flex items-center gap-3">
              <BrandMark />
              <p className="font-sans font-bold text-base tracking-tight">Katuwang</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <span className="kt-nav-label pb-0! px-2! text-primary">{portalLabel}</span>
          <div className="flex-1">{navTree}</div>
          <div className="flex flex-col gap-3 px-2 pb-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xs font-semibold uppercase tracking-wide text-base-content/45">
                Anonymous ID
              </span>
              {idNode}
            </div>
            {logoutLink}
          </div>
        </aside>

      {chatbotEnabled && <ChatWidget />}
    </div>
  );
}
