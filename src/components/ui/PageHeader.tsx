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
          <p className="text-2xs font-semibold uppercase tracking-wider text-base-content/40">
            {eyebrow}
          </p>
        )}
        <h1 className="font-sans text-2xl sm:text-[1.75rem] font-bold tracking-tight text-base-content leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
