import { AlertCircle, CheckCircle, Info, TriangleAlert } from "lucide-react";

const VARIANTS = {
  success: { cls: "kt-alert--success", Icon: CheckCircle, icon: "text-success" },
  error: { cls: "kt-alert--error", Icon: AlertCircle, icon: "text-error" },
  info: { cls: "kt-alert--info", Icon: Info, icon: "text-info" },
  warning: { cls: "kt-alert--warning", Icon: TriangleAlert, icon: "text-warning" },
} as const;

export default function FeedbackBanner({
  variant,
  message,
}: {
  variant: keyof typeof VARIANTS;
  message: string | null;
}) {
  if (!message) return null;
  const { cls, Icon, icon } = VARIANTS[variant];

  return (
    <div className={`kt-alert ${cls} text-xs`} role="status">
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${icon}`} />
      <span className="text-base-content">{message}</span>
    </div>
  );
}
