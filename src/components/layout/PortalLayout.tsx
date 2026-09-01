"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, HelpCircle, LogOut, Menu, Search } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** sidebar section this item belongs under; items keep first-seen group order */
  group?: string;
}

type PortalAccent = "primary" | "secondary" | "accent";

interface PortalLayoutProps {
  navItems: NavItem[];
  anonymousId: string;
  portalLabel: string;
  accent: PortalAccent;
  idRole?: "LEARNER" | "TUTOR";
  children: React.ReactNode;
}

const PORTAL_ROOTS = ["/admin", "/tutor", "/learner"];

export default function PortalLayout({
  navItems,
  anonymousId,
  portalLabel,
  idRole,
  children,
}: PortalLayoutProps) {
  const pathname = usePathname();

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
        <span className="kt-nav-label !pb-0 !px-2 text-primary">{portalLabel}</span>
        <div className="flex-1">{navTree}</div>
        <div className="kt-promo">
          <strong className="font-sans font-bold text-sm">Fully anonymous</strong>
          <p className="text-xs opacity-90">
            Names stay hidden across the learner–tutor line. Every session is moderated.
          </p>
        </div>
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
          {/* mobile nav */}
          <details className="lg:hidden relative [&_summary::-webkit-details-marker]:hidden">
            <summary className="list-none btn btn-ghost btn-sm btn-square" aria-label="Menu">
              <Menu className="w-5 h-5" />
            </summary>
            <div className="absolute left-0 top-full mt-2 w-64 kt-card p-3 z-30 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BrandMark size="sm" />
                <span className="font-sans font-bold text-sm">Katuwang</span>
              </div>
              {navTree}
              {logoutLink}
            </div>
          </details>

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
          <button type="button" className="kt-icon-btn" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <span className="kt-avatar" aria-hidden="true">
            {anonymousId.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
