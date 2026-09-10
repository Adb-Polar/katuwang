import type { ReactNode } from "react";

/**
 * The muted italic "nothing here yet" row shown in place of an empty table body
 * or list. Matches the admin-table empty copy styling.
 */
export default function EmptyState({
  children,
  padding = "py-8",
}: {
  children: ReactNode;
  padding?: string;
}) {
  return (
    <div className={`text-center ${padding} text-base-content/40 italic text-sm`}>
      {children}
    </div>
  );
}
