import type { ReactNode } from "react";

export default function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-control w-full gap-1.5">
      <label className="label py-0">
        <span className="label-text text-xs font-semibold text-base-content/80">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </span>
      </label>
      {children}
      {error ? (
        <p className="text-2xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-2xs text-base-content/50">{hint}</p>
      ) : null}
    </div>
  );
}
