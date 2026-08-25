const TONE_CLASSES = {
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  info: "badge-info",
  neutral: "badge-neutral",
} as const;

const SIZES = {
  xs: "badge-xs text-2xs",
  sm: "badge-sm text-xs",
} as const;

export default function StatusBadge({
  tone,
  label,
  size = "sm",
}: {
  tone: keyof typeof TONE_CLASSES;
  label: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span className={`badge ${TONE_CLASSES[tone]} ${SIZES[size]} font-semibold uppercase tracking-wide`}>
      {label}
    </span>
  );
}
