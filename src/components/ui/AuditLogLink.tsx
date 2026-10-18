import Link from "next/link";

/** "View audit log" link that opens the admin audit log filtered to one target id. */
export default function AuditLogLink({
  targetId,
  children = "View audit log",
  className = "mt-1 inline-block",
}: {
  targetId: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={`/admin/audit-log?q=${targetId}`}
      className={`text-2xs text-primary hover:underline ${className}`}
    >
      {children}
    </Link>
  );
}
