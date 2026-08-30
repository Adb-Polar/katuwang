import type { ReactNode } from "react";

export default function FormField({
  label,
  required,
  hint,
  error,
  orientation = "vertical",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  orientation?: "vertical" | "horizontal";
  children: ReactNode;
}) {
  const labelNode = (
    <span className="label-text text-xs font-semibold text-base-content/80">
      {label}
      {required && <span className="text-error ml-0.5">*</span>}
    </span>
  );

  const feedback = error ? (
    <p className="text-2xs text-error">{error}</p>
  ) : hint ? (
    <p className="text-2xs text-base-content/50">{hint}</p>
  ) : null;

  if (orientation === "horizontal") {
    return (
      <div className="form-control w-full gap-2 sm:flex-row sm:items-start sm:gap-3">
        <label className="label py-0 sm:w-40 sm:shrink-0 sm:pt-2">{labelNode}</label>
        <div className="w-full space-y-1">
          {children}
          {feedback}
        </div>
      </div>
    );
  }

  return (
    <div className="form-control w-full gap-2">
      <label className="label py-0">{labelNode}</label>
      {children}
      {feedback}
    </div>
  );
}
