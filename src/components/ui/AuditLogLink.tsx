"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * "View audit log" link that opens the audit log filtered to one target id.
 * The audit log is super-admin only, so other admins get no link.
 */
export default function AuditLogLink({
  targetId,
  children = "View audit log",
  className = "mt-1",
}: {
  targetId: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { data: session } = useSession();
  if (session?.user?.role !== "SUPER_ADMIN") return null;

  return (
    <Link
      href={`/admin/audit-log?q=${targetId}`}
      className={`inline-flex min-h-11 items-center text-sm text-primary hover:underline sm:min-h-0 ${className}`}
    >
      {children}
    </Link>
  );
}
