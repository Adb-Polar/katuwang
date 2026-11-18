const TONE_CLASSES = {
  success: "text-success",
  warning: "text-(--kt-warning-text)",
  error: "text-error",
  info: "text-info",
  neutral: "text-(--kt-muted)",
} as const;

export type StatusTone = keyof typeof TONE_CLASSES;

/**
 * A status written as coloured text with a leading dot — the table/row
 * counterpart of `StatusBadge` for pages that read better without pills.
 */
export default function StatusText({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium ${TONE_CLASSES[tone]}`}>
      <span aria-hidden="true" className="text-[0.6em]">●</span>
      {label}
    </span>
  );
}
