import { AlertCircle, CheckCircle, Info, TriangleAlert } from "lucide-react";

const VARIANTS = {
  success: { alert: "alert-success", Icon: CheckCircle },
  error: { alert: "alert-error", Icon: AlertCircle },
  info: { alert: "alert-info", Icon: Info },
  warning: { alert: "alert-warning", Icon: TriangleAlert },
} as const;

export default function FeedbackBanner({
  variant,
  message,
}: {
  variant: keyof typeof VARIANTS;
  message: string | null;
}) {
  if (!message) return null;
  const { alert, Icon } = VARIANTS[variant];

  return (
    <div className={`alert ${alert} py-3 text-xs`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
