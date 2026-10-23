import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

export default function FormField({
  label, required, hint, error, orientation = "vertical", size = "sm", children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md";
  children: ReactNode;
}) {
  const generatedId = useId();
  const nodes = Children.toArray(children);
  const nativeChild = nodes.find((node) =>
    isValidElement(node) && typeof node.type === "string" && ["input", "select", "textarea"].includes(node.type)
  ) as ReactElement<Record<string, unknown>> | undefined;
  const id = nativeChild ? (nativeChild.props.id as string | undefined) ?? generatedId : undefined;
  const feedbackId = `${generatedId}-feedback`;
  const labelId = `${generatedId}-label`;
  const control = nativeChild ? nodes.map((node) => node === nativeChild
    ? cloneElement(nativeChild, {
        id,
        "aria-describedby": [nativeChild.props["aria-describedby"], hint || error ? feedbackId : undefined].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : nativeChild.props["aria-invalid"],
        required: required || nativeChild.props.required,
      })
    : node) : children;
  const labelNode = (
    <span className={`${size === "md" ? "text-sm" : "text-xs"} font-semibold text-base-content/80`}>
      {label}{required && <span className="text-error ml-0.5">*</span>}
    </span>
  );
  const feedback = error ? <p id={feedbackId} className="text-xs text-error mt-1">{error}</p>
    : hint ? <p id={feedbackId} className="text-xs text-base-content/60 mt-1">{hint}</p> : null;
  const labelElement = nativeChild ? <label htmlFor={id}>{labelNode}</label> : <div id={labelId}>{labelNode}</div>;
  if (orientation === "horizontal") return (
    <div role={nativeChild ? undefined : "group"} aria-labelledby={nativeChild ? undefined : labelId} aria-describedby={!nativeChild && (hint || error) ? feedbackId : undefined} className="w-full flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
      <div className="sm:w-40 sm:shrink-0 sm:pt-2">{labelElement}</div>
      <div className="w-full">{control}{feedback}</div>
    </div>
  );
  return <div role={nativeChild ? undefined : "group"} aria-labelledby={nativeChild ? undefined : labelId} aria-describedby={!nativeChild && (hint || error) ? feedbackId : undefined} className="w-full flex flex-col gap-1.5">{labelElement}{control}{feedback}</div>;
}
