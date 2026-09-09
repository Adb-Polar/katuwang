import { ShieldCheck } from "lucide-react";

/*
  Colored by the ID owner's role, not by whichever portal is currently open —
  a learner's ID stays violet even inside the Tutor portal's roster, and vice
  versa. Static class strings only (Tailwind 4's content scanner can't see
  interpolated classes); role colors come from the redesign layer in globals.css.
*/
const ROLE_STYLES = {
  LEARNER: "bg-(--kt-tint-learner) kt-id--learner",
  TUTOR: "bg-(--kt-tint-tutor) kt-id--tutor",
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
  return (
    <span
      className={`inline-flex items-center text-nowrap rounded-full font-mono font-medium tracking-wide ${ROLE_STYLES[role]} ${SIZES[size]}`}
    >
      {showIcon && <ShieldCheck className="w-3 h-3 shrink-0" />}
      {id}
    </span>
  );
}
