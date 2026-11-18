import { BadgeCheck } from "lucide-react";

/**
 * A topic pill. When `verified` (the tutor holds a CERTIFIED certification for
 * it) the pill gets a green outline + check icon so "verified" reads at a
 * glance, not just from the small icon.
 */
export default function TopicChip({
  topic,
  verified = false,
  tone = "neutral",
  className = "",
}: {
  topic: string;
  verified?: boolean;
  tone?: "neutral" | "primary";
  className?: string;
}) {
  const base = tone === "primary" ? "badge-primary" : "";
  return (
    <span
      title={topic}
      className={`badge badge-outline h-auto min-h-6 text-[0.8rem] font-medium gap-1 py-0.5 ${
        verified ? "border-success/60 text-success" : base
      } ${className}`}
    >
      {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span className="min-w-0 truncate">{topic}</span>
    </span>
  );
}
