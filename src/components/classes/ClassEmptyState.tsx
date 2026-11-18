import type { ReactNode } from "react";

/** "No classes" in a class list: one plain line on a card, with the next step as a link after it. */
export default function ClassEmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="kt-card px-5 py-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <p>{message}</p>
      {action}
    </div>
  );
}
