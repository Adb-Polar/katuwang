import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type StatCardTint = "primary" | "secondary" | "accent" | "success" | "error";

/** Literal so the Tailwind content scanner keeps every class. */
const TINT: Record<StatCardTint, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  error: "bg-error/10 text-error",
};

const BASE = "card kt-card kt-stat p-4 flex-row items-start justify-between gap-2";

/**
 * The dashboard stat tile — a label + big mono value with a tinted icon chip.
 * Renders as a plain card, or as a hover-highlighted `<Link>` when `href` is set.
 */
export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tint: StatCardTint;
  href?: string;
}

export default function StatCard({ label, value, icon: Icon, tint, href }: StatCardProps) {
  const body = (
    <>
      <div>
        <span className="kt-stat-title">{label}</span>
        <span className="kt-stat-value">{value}</span>
      </div>
      <span className={`p-2 rounded-lg shrink-0 ${TINT[tint]}`}>
        <Icon className="h-4 w-4" />
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={`${BASE} hover:border-primary/40 transition-colors`}>
      {body}
    </Link>
  ) : (
    <div className={BASE}>{body}</div>
  );
}
