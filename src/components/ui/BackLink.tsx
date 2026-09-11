import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The "‹ Back to X" ghost-button link that sits above a detail page or an
 * in-page sub-view. One place to later add a `router.back()` fallback or a
 * keyboard shortcut (see `docs/reviews/reviews.md`, Back-Navigation Review B4).
 */
export default function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="btn btn-ghost btn-sm text-xs gap-1.5">
      <ArrowLeft className="h-3.5 w-3.5" />
      {children}
    </Link>
  );
}
