"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * "View audit log" link that opens the admin audit log filtered to one target
 * id. Renders nothing for regular admins — the audit log is super-admin only.
 */
export default function AuditLogLink({
  targetId,
  children = "View audit log",
}: {
  targetId: string;
  children?: React.ReactNode;
}) {
  const { data: session } = useSession();
  if (!session?.user.isSuperAdmin) return null;

  return (
    <Link
      href={`/admin/audit-log?q=${targetId}`}
      className="text-2xs text-primary hover:underline mt-1 inline-block"
    >
      {children}
    </Link>
  );
}
