import { ShieldCheck } from "lucide-react";

/*
  Colored by the ID owner's role, not by whichever portal is currently open —
  that's the point: a learner's ID stays violet even inside the Tutor portal's
  roster, and vice versa. Static class strings only (Tailwind 4's content
  scanner can't see interpolated `bg-${x}` classes).
*/
const ROLE_STYLES = {
  LEARNER: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    border: "border-secondary/20",
  },
  TUTOR: {
    bg: "bg-accent/15",
    text: "text-accent-content",
    border: "border-accent/30",
  },
} as const;

const SIZES = {
  sm: "text-2xs px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
} as const;

export default function AnonymousIdBadge({
  id,
  role,
  size = "sm",
  showIcon = false,
}: {
  id: string;
  role: keyof typeof ROLE_STYLES;
  size?: keyof typeof SIZES;
  showIcon?: boolean;
}) {
  const { bg, text, border } = ROLE_STYLES[role];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono font-semibold tracking-wide ${bg} ${text} ${border} ${SIZES[size]}`}
    >
      {showIcon && <ShieldCheck className="w-3 h-3 shrink-0" />}
      {id}
    </span>
  );
}
