import { Calendar } from "lucide-react";
import type { ReactNode } from "react";

export default function ClassEmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-10 bg-base-200/20 border border-dashed border-base-300 rounded-xl">
      <Calendar className="h-8 w-8 mx-auto text-base-content/30 mb-2" />
      <p className="text-xs font-semibold text-base-content/50">{message}</p>
      {action}
    </div>
  );
}
