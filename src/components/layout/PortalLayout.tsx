"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

type PortalAccent = "primary" | "secondary" | "accent";

/* Static lookup so Tailwind 4's content scanner can see every class string. */
const ACCENT_STYLES: Record<PortalAccent, { active: string; icon: string }> = {
  primary: { active: "bg-primary/10 text-primary font-semibold", icon: "text-primary" },
  secondary: { active: "bg-secondary/10 text-secondary font-semibold", icon: "text-secondary" },
  accent: { active: "bg-accent/15 text-accent-content font-semibold", icon: "text-accent-content" },
};

interface PortalLayoutProps {
  navItems: NavItem[];
  anonymousId: string;
  portalLabel: string;
  accent: PortalAccent;
  idRole?: "LEARNER" | "TUTOR";
  children: React.ReactNode;
}

export default function PortalLayout({
  navItems,
  anonymousId,
  portalLabel,
  accent,
  idRole,
  children,
}: PortalLayoutProps) {
  const pathname = usePathname();
  const { active: activeNavClass, icon: iconAccentClass } = ACCENT_STYLES[accent];

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="portal-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <div className="navbar bg-base-100 border-b border-base-200 shadow-sm sticky top-0 z-10 lg:hidden">
          <label htmlFor="portal-drawer" className="btn btn-square btn-ghost btn-sm">
            <Menu className="w-5 h-5" />
          </label>
          <div className="flex items-center gap-2 ml-2">
            <BrandMark size="sm" />
            <span className="font-serif font-semibold text-sm tracking-tight">Katuwang</span>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </main>
      </div>

      <div className="drawer-side z-20">
        <label htmlFor="portal-drawer" aria-label="Close sidebar" className="drawer-overlay"></label>

        <aside className="min-h-full w-72 bg-base-100 border-r border-base-200 shadow-sm flex flex-col">
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-5">
            <BrandMark />
            <div className="leading-tight">
              <p className="font-serif font-semibold text-base tracking-tight">Katuwang</p>
              <p className="text-2xs font-semibold uppercase tracking-wider text-base-content/40">
                {portalLabel}
              </p>
            </div>
          </div>

          <div className="divider my-0 px-5"></div>

          {/* Navigation */}
          <ul className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/tutor" || item.href === "/learner"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? activeNavClass
                        : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Account footer */}
          <div className="p-4 border-t border-base-200 space-y-3">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-base-200/60">
              <span className="text-2xs text-base-content/50">Anonymous ID</span>
              {idRole ? (
                <AnonymousIdBadge id={anonymousId} role={idRole} showIcon />
              ) : (
                <span className={`font-mono text-xs font-semibold tracking-wide ${iconAccentClass}`}>
                  {anonymousId}
                </span>
              )}
            </div>
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error/80 hover:bg-error/10 hover:text-error transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
