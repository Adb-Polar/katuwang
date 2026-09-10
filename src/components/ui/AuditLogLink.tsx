import Link from "next/link";

/** "View audit log" link that opens the admin audit log filtered to one target id. */
export default function AuditLogLink({
  targetId,
  children = "View audit log",
}: {
  targetId: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={`/admin/audit-log?q=${targetId}`}
      className="text-2xs text-primary hover:underline mt-1 inline-block"
    >
      {children}
    </Link>
  );
}
