"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const MAX_WIDTH = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * The one modal shell: backdrop + box, closes on Escape / backdrop click, traps
 * Tab focus while open, and restores focus to the trigger on close. `ConfirmDialog`
 * and `PromptDialog` render their own body through this (with `bare`); ad-hoc
 * modals pass a `title` and get the standard close button.
 */
export default function Modal({
  open,
  onClose,
  title,
  size = "sm",
  bare = false,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: keyof typeof MAX_WIDTH;
  /** Skip the built-in header/close button — the child renders its own chrome. */
  bare?: boolean;
  closeOnBackdrop?: boolean;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const box = boxRef.current;
    const initial = box?.querySelector<HTMLElement>(FOCUSABLE) ?? box;
    initial?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !box) return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-label={title}>
      <div
        ref={boxRef}
        tabIndex={-1}
        className={`modal-box ${MAX_WIDTH[size]} p-6 kt-card outline-none`}
        style={{ boxShadow: "var(--kt-shadow-pop)" }}
      >
        {!bare && (
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-bold text-sm text-base-content">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost -mr-2 -mt-2 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
      <label
        className="modal-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-label="Close"
      />
    </div>
  );
}
