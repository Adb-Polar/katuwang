const TONE_CLASSES = {
  success: "kt-badge--success",
  warning: "kt-badge--warning",
  error: "kt-badge--error",
  info: "kt-badge--info",
  neutral: "kt-badge--neutral",
} as const;

export default function StatusBadge({
  tone,
  label,
  code,
  size = "sm",
}: {
  tone: keyof typeof TONE_CLASSES;
  label: string;
  /** optional 3-letter notation code shown before the label (e.g. "OPN") */
  code?: string;
  size?: "xs" | "sm";
}) {
  return (
    <span
      className={`kt-badge ${TONE_CLASSES[tone]} ${size === "xs" ? "text-[0.66rem] px-2" : ""}`}
    >
      {code && <span className="kt-code">{code}</span>}
      {label}
    </span>
  );
}
