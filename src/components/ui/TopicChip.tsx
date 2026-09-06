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
      className={`badge badge-outline badge-sm text-2xs font-semibold gap-1 py-2.5 ${
        verified ? "border-success/60 text-success" : base
      } ${className}`}
    >
      {verified && <BadgeCheck className="h-3 w-3" />}
      {topic}
    </span>
  );
}
