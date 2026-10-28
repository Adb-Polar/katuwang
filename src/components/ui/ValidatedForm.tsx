"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { fieldValidationMessage } from "@/lib/formValidation";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Failure = { target: HTMLElement; container: HTMLElement; message: string; id: string };
const controls = (form: HTMLFormElement) => Array.from(form.querySelectorAll<Control>("input, select, textarea"));

/** Keeps native constraints, renders persistent inline feedback, and focuses the first failure. */
export default function ValidatedForm({ onSubmit, children, ...props }: ComponentProps<"form">) {
  const ref = useRef<HTMLFormElement>(null);
  const prefix = useId();
  const focusRequested = useRef(false);
  const [failures, setFailures] = useState<Failure[]>([]);

  function failure(target: HTMLElement, message: string, index: number): Failure {
    const field = target.closest<HTMLElement>("[data-form-field]");
    return { target, message, id: `${prefix}-error-${index}`, container: target.closest<HTMLElement>("[data-control-field]")?.querySelector<HTMLElement>("[data-control-feedback]") ?? field?.querySelector<HTMLElement>("[data-field-feedback]") ?? field ?? target.closest<HTMLElement>(".form-control") ?? target.parentElement! };
  }

  function show(next: Failure[]) {
    focusRequested.current = true;
    setFailures(next);
  }

  useEffect(() => {
    const form = ref.current!;
    const handle = (event: Event) => {
      const { label, message, target: explicitTarget } = (event as CustomEvent<{ label?: string; message: string; target?: HTMLElement }>).detail;
      const field = Array.from(form.querySelectorAll<HTMLElement>("[data-form-field]")).find((el) => el.dataset.formField?.toLowerCase().startsWith((label ?? "").toLowerCase()));
      const target = explicitTarget ?? field?.querySelector<HTMLElement>("input[type=checkbox]:not(:disabled)") ?? field?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea") ?? field?.querySelector<HTMLElement>("button:not(:disabled)") ?? field;
      if (target) {
        if (!target.matches("input, select, textarea, button")) target.tabIndex = -1;
        const next = failure(target, message, 0);
        focusRequested.current = true;
        setFailures([next]);
      }
    };
    form.addEventListener("field-error", handle);
    return () => form.removeEventListener("field-error", handle);
    // The form's generated ID is stable for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  useEffect(() => {
    if (focusRequested.current) {
      const first = failures[0]?.target;
      first?.focus();
      first?.scrollIntoView?.({ block: "center", behavior: "smooth" });
      focusRequested.current = false;
    }
    for (const { target, id } of failures) {
      target.setAttribute("aria-invalid", "true");
      const existing = target.getAttribute("aria-describedby")?.split(" ").filter(Boolean) ?? [];
      target.setAttribute("aria-describedby", [...existing, id].join(" "));
    }
    return () => {
      for (const { target, id } of failures) {
        target.removeAttribute("aria-invalid");
        const remaining = target.getAttribute("aria-describedby")?.split(" ").filter((part) => part !== id).join(" ");
        if (remaining) target.setAttribute("aria-describedby", remaining);
        else target.removeAttribute("aria-describedby");
      }
    };
  }, [failures]);

  return (
    <form {...props} ref={ref} noValidate onClickCapture={(event) => {
      const button = (event.target as HTMLElement).closest("button[data-validation-change], button[aria-pressed]");
      const field = button?.closest("[data-form-field]");
      if (field) setFailures((prev) => prev.filter((item) => item.target.closest("[data-form-field]") !== field));
      props.onClickCapture?.(event);
    }} onChangeCapture={(event) => {
      const target = event.target as HTMLElement;
      setFailures((prev) => prev.filter((item) => item.target !== target && (!target.closest("[data-form-field]") || item.target.closest("[data-form-field]") !== target.closest("[data-form-field]"))));
      props.onChangeCapture?.(event);
    }} onSubmit={(event) => {
      const invalid = controls(event.currentTarget).flatMap((field, index) => {
        const message = fieldValidationMessage(field);
        return message ? [failure(field, message, index)] : [];
      });
      if (invalid.length) {
        event.preventDefault();
        show(invalid);
        return;
      }
      setFailures([]);
      onSubmit?.(event);
    }}>
      {children}
      {failures.map(({ container, message, id }) => createPortal(<p key={id} id={id} role="alert" className="text-xs text-error mt-1 w-full">{message}</p>, container, id))}
    </form>
  );
}
