"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

interface Action {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
}

export default function ActionMenu({ label, actions, disabled = false }: {
  label: string;
  actions: Action[];
  disabled?: boolean;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);

  const close = () => {
    setPosition(null);
    triggerRef.current?.focus();
  };

  const open = () => {
    const rect = triggerRef.current!.getBoundingClientRect();
    const width = Math.min(256, window.innerWidth - 16);
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const flip = below < actions.length * 44 + 16 && above > below;
    setPosition({
      position: "fixed",
      width,
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
      maxHeight: flip ? above : below,
    });
  };

  useEffect(() => {
    if (!position) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setPosition(null);
    };
    const dismiss = () => setPosition(null);
    const onScroll = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) dismiss();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [position]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={position !== null}
        aria-controls={position ? id : undefined}
        disabled={disabled}
        className="btn btn-ghost btn-sm btn-square min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
        onClick={() => position ? close() : open()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            open();
          }
        }}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      {position && createPortal(
        <div
          ref={menuRef}
          id={id}
          role="menu"
          aria-label={label}
          style={position}
          className="z-[60] overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1.5 shadow-lg"
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Tab") {
              if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); }
              close();
              return;
            }
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const items = Array.from(menuRef.current!.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
            const current = items.indexOf(document.activeElement as HTMLButtonElement);
            const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
              : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
          }}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={action.disabled}
              title={action.title}
              className={`flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs whitespace-normal hover:bg-base-200 focus:bg-base-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 ${action.danger ? "mt-1 border-t border-base-200 text-error" : ""}`}
              onClick={() => { close(); action.onSelect(); }}
            >
              <span className="shrink-0" aria-hidden="true">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
