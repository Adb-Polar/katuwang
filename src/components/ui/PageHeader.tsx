import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <p className="font-serif italic text-base leading-none text-primary">{eyebrow}</p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-base-content leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-(--kt-muted)">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
